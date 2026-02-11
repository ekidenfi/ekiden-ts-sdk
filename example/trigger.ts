// Bybit-style trigger conformance example:
// 1. Authenticate two traders (A taker + X maker).
// 2. Auto-bootstrap local accounts (fund/registration/deposit) when needed.
// 3. Validate stop-market + stop-limit trigger lifecycle.
// 4. Validate untriggered cancel lifecycle and StopOrder filtering.
// 5. Validate trigger source paths (MarkPrice / IndexPrice / LastPrice).
// 6. Validate setTradingStop TP/SL order creation and position updates.
//
// Required env (prod/staging/dev):
// - PK=<trader_a_root_private_key>
// - PK_MAKER=<trader_x_root_private_key>
//
// Local defaults:
// - If PK/PK_MAKER are missing, script uses APTOS_E2E_PRIVATE_KEY / APTOS_E2E_SUB_PRIVATE_KEY from .env.
// - LOCAL_AUTO_BOOTSTRAP=true by default on local (can be disabled).
//
// Local copy/paste (after `just up-bare`):
// - `set -a; source .env; set +a; NETWORK=local STRICT_TRIGGER_SOURCE=false bun run example/trigger.ts`
//
// Example .env:
// APTOS_E2E_PRIVATE_KEY=0x0a340d62b03255f45c4f66df878001733083fe5bf31b328c1e633085a9e146e0
// APTOS_E2E_ASSET_METADATA=0x9967e130f7419f791c240acc17dde966ec84ad41652e2e87083ee613f460d019
// APTOS_E2E_VAULT_ADDRESS=0x81c121173a5fa4512459a6406ea1a9ff965bf91dfc1203d2e63b5a198a1ba764
// APTOS_E2E_SUB_PRIVATE_KEY=0xf575b9f4b6e3411563b6d9900289fbf2c1f1acf6a908f8ba9fddf2f06d06145a

import {
  Account,
  createSubAccountsDeterministic,
  Ed25519PrivateKey,
  EkidenClient,
  PrivateKey,
  PrivateKeyVariants,
  type InstrumentInfo,
  type Order,
  type Position,
  type Side,
  type TriggerBy,
  type TriggerDirection,
} from "../src";
import { auth, SDK_CONFIG } from "./auth";
import {
  depositToTrading,
  ensureRegistration,
  fundAccount,
  getAptosClient,
} from "./faucet";

type Trader = {
  client: EkidenClient;
  subAccount: string;
};

type AuthContext = {
  client: EkidenClient;
  token: string;
  suggestedTradingSub: string;
};

type MarketContext = {
  symbol: string;
  instrument: InstrumentInfo;
  mark: number;
  index: number;
  last: number;
  bestBid: number;
  bestAsk: number;
  tickSize: number;
  tickDecimals: number;
  qtyStep: number;
  qtyDecimals: number;
};

type PlaceStopParams = {
  symbol: string;
  side: Side;
  orderType: "Market" | "Limit";
  qty: string;
  price: string;
  orderLinkId: string;
  triggerBy: TriggerBy;
  triggerDirection: TriggerDirection;
  triggerPrice: string;
};

const env = process.env;
const NETWORK = env.NETWORK ?? "staging";
const STRICT_TRIGGER_SOURCE =
  (env.STRICT_TRIGGER_SOURCE ?? "true").toLowerCase() !== "false";
const LOCAL_AUTO_BOOTSTRAP =
  NETWORK === "local" &&
  (env.LOCAL_AUTO_BOOTSTRAP ?? "true").toLowerCase() !== "false";
const LOG_TRIGGER_WS = (env.LOG_TRIGGER_WS ?? "true").toLowerCase() !== "false";

const TIMEOUT = {
  order: 25_000,
  position: 20_000,
  short: 3_000,
};

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const section = (name: string) => console.log(`\n=== ${name} ===`);

function parseNumber(raw: string, label: string): number {
  const value = Number.parseFloat(raw.replace(/_/g, ""));
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric value for ${label}: ${raw}`);
  }
  return value;
}

function decimalPlaces(raw: string): number {
  const dot = raw.indexOf(".");
  return dot < 0 ? 0 : raw.length - dot - 1;
}

function roundToStep(
  value: number,
  step: number,
  mode: "up" | "down" | "nearest",
): number {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
    throw new Error(`Invalid rounding input value=${value} step=${step}`);
  }
  const ratio = value / step;
  const scaled =
    mode === "up"
      ? Math.ceil(ratio - 1e-12)
      : mode === "down"
        ? Math.floor(ratio + 1e-12)
        : Math.round(ratio);
  return scaled * step;
}

function fmt(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function approxEqString(
  a: string | null | undefined,
  b: string,
  eps = 1e-9,
): boolean {
  if (!a) return false;
  return Math.abs(parseNumber(a, "lhs") - parseNumber(b, "rhs")) <= eps;
}

function uniqueLink(tag: string): string {
  return `${tag}-${runId}-${Math.random().toString(36).slice(2, 6)}`;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function isConditionalOrder(row: Order): boolean {
  return Boolean(
    row.trigger ||
    row.stop_order_type ||
    row.order_status === "Untriggered" ||
    row.order_status === "Triggered",
  );
}

function printWsOrder(row: Order): void {
  const triggerBy = row.trigger?.trigger_by ?? "-";
  const triggerPrice = row.trigger?.trigger_price ?? "-";
  const triggerDirection = row.trigger?.trigger_direction ?? "-";
  console.log(
    `[WS][order] status=${row.order_status} symbol=${row.symbol} link=${row.order_link_id ?? "-"} id=${row.order_id} stop_type=${row.stop_order_type ?? "-"} trigger=${triggerBy}/${triggerDirection}@${triggerPrice}`,
  );
}

async function eventually<T>(
  label: string,
  producer: () => Promise<T>,
  predicate: (value: T) => boolean,
  { timeoutMs, intervalMs = 300 }: { timeoutMs: number; intervalMs?: number },
): Promise<T> {
  const started = Date.now();
  let lastValue: T | undefined;
  let lastError: unknown;

  while (Date.now() - started < timeoutMs) {
    try {
      const value = await producer();
      lastValue = value;
      if (predicate(value)) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(intervalMs);
  }

  if (lastError instanceof Error) {
    throw new Error(
      `${label} timed out (${timeoutMs}ms). Last error: ${lastError.message}`,
    );
  }
  throw new Error(
    `${label} timed out (${timeoutMs}ms). Last value: ${JSON.stringify(lastValue)}`,
  );
}

function normalizePrivateKey(privateKeyRaw: string): string {
  return PrivateKey.formatPrivateKey(privateKeyRaw, PrivateKeyVariants.Ed25519);
}

function asSubAccounts(resp: unknown): string[] {
  if (!resp || typeof resp !== "object") return [];
  const maybe = resp as {
    sub_accounts?: string[];
    sub_account_addresses?: string[];
  };
  return maybe.sub_accounts ?? maybe.sub_account_addresses ?? [];
}

async function authorizeClient(
  label: string,
  privateKeyRaw: string,
): Promise<AuthContext> {
  const normalizedPrivateKey = normalizePrivateKey(privateKeyRaw);
  const client = new EkidenClient(SDK_CONFIG);
  const [token, account] = await auth(normalizedPrivateKey, client);
  const deterministicSubs = await createSubAccountsDeterministic(
    account.accountAddress.toString(),
  );
  console.log(`${label} authorized: ${token.slice(0, 12)}...`);
  return {
    client,
    token,
    suggestedTradingSub: deterministicSubs.trading.address,
  };
}

async function resolveTradingSubAccount(
  client: EkidenClient,
  explicit: string | undefined,
  suggestedTradingSub: string,
  label: "A" | "B",
): Promise<string> {
  if (explicit) return explicit;

  const subAccounts = asSubAccounts(await client.user.getSubAccounts());
  if (subAccounts.includes(suggestedTradingSub)) {
    return suggestedTradingSub;
  }

  const balances = await client.account.getBalance();
  const fromBalance = balances.list.find((row) => {
    const t = row.account_type.toLowerCase();
    return t.includes("trading") || t.includes("cross");
  });
  if (fromBalance) return fromBalance.sub_account_address;

  if (subAccounts.length > 0) {
    console.warn(
      `Could not infer trading sub-account for Trader ${label}; using first sub-account (${subAccounts[0]}). Set TRIGGER_SUB_ACCOUNT_${label} to override.`,
    );
    return subAccounts[0];
  }

  throw new Error(`No sub-account found for Trader ${label}.`);
}

async function authorizeWithRetry(
  privateKeyRaw: string,
  client: EkidenClient,
): Promise<string> {
  const normalized = normalizePrivateKey(privateKeyRaw);
  const started = Date.now();
  let lastError: unknown;
  while (Date.now() - started < 60_000) {
    try {
      const [token] = await auth(normalized, client);
      return token;
    } catch (error) {
      lastError = error;
      await sleep(2_000);
    }
  }
  if (lastError instanceof Error) {
    throw new Error(
      `Failed to authorize after bootstrap: ${lastError.message}`,
    );
  }
  throw new Error("Failed to authorize after bootstrap");
}

async function ensureAptBalanceForFees(
  client: EkidenClient,
  rootAddress: string,
  minimumOctas = 60_000_000,
): Promise<void> {
  const aptos = await getAptosClient(SDK_CONFIG.baseURL);

  for (let attempt = 0; attempt < 15; attempt++) {
    const balance = Number(
      await aptos.getAccountAPTAmount({
        accountAddress: rootAddress,
      }),
    );
    if (balance >= minimumOctas) return;

    await client.account.fund({
      receiver: rootAddress,
      metadatas: ["0x1::aptos_coin::AptosCoin"],
      amounts: [10_000_000],
    });
    await sleep(1_500);
  }

  const finalBalance = Number(
    await aptos.getAccountAPTAmount({
      accountAddress: rootAddress,
    }),
  );
  if (finalBalance < minimumOctas) {
    throw new Error(
      `Insufficient APT for gas on ${rootAddress}. Need >= ${minimumOctas}, have ${finalBalance}.`,
    );
  }
}

async function getTradingAvailableBalance(
  client: EkidenClient,
  tradingSubAddress: string,
): Promise<number> {
  const balances = await client.account.getBalance();
  const row = balances.list.find(
    (b) => b.sub_account_address === tradingSubAddress,
  );
  if (!row) return 0;
  return parseNumber(
    row.available_balance,
    `available_balance:${tradingSubAddress}`,
  );
}

async function bootstrapLocalTrader(
  label: string,
  privateKeyRaw: string,
): Promise<void> {
  const normalized = normalizePrivateKey(privateKeyRaw);
  const root = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(normalized),
  });
  const { funding, trading } = await createSubAccountsDeterministic(
    root.accountAddress.toString(),
  );
  const fundingAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(funding.privateKey),
  });
  const tradingAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(trading.privateKey),
  });

  const client = new EkidenClient(SDK_CONFIG);
  const aptos = await getAptosClient(SDK_CONFIG.baseURL);
  const systemInfo = await client.system.getSystemInfo();
  client.config.contractAddress = systemInfo.perpetual_addr;
  const minTradingBalance = 50;

  console.log(`Bootstrapping Trader ${label} on local...`);
  try {
    try {
      const [preToken] = await auth(normalized, client);
      client.setToken(preToken);
      const existingTrading = await getTradingAvailableBalance(
        client,
        trading.address,
      );
      if (existingTrading >= minTradingBalance) {
        console.log(
          `Trader ${label} already has ${existingTrading} in trading sub-account; skipping faucet/bootstrap.`,
        );
        return;
      }
    } catch {
      // Needs registration/bootstrap path.
    }

    await ensureAptBalanceForFees(client, root.accountAddress.toString());
    await ensureRegistration(
      client,
      root,
      systemInfo,
      fundingAccount,
      tradingAccount,
      aptos,
    );
    client.setToken(await authorizeWithRetry(normalized, client));

    const tradingBeforeDeposit = await getTradingAvailableBalance(
      client,
      trading.address,
    );
    if (tradingBeforeDeposit >= minTradingBalance) {
      console.log(
        `Trader ${label} already has ${tradingBeforeDeposit} in trading sub-account; skipping deposit.`,
      );
      return;
    }

    try {
      await depositToTrading(
        client,
        root,
        trading.address,
        funding.address,
        systemInfo.quote_asset_metadata,
        100n * 1_000_000n,
        aptos,
      );
    } catch {
      await fundAccount(
        client,
        root,
        systemInfo.quote_asset_metadata,
        aptos,
        200 * 10 ** 6,
      );
      await ensureAptBalanceForFees(client, root.accountAddress.toString());
      await depositToTrading(
        client,
        root,
        trading.address,
        funding.address,
        systemInfo.quote_asset_metadata,
        100n * 1_000_000n,
        aptos,
      );
    }
  } finally {
    client.close();
  }
}

async function loadMarketContext(
  client: EkidenClient,
  symbol: string,
  instrument: InstrumentInfo,
): Promise<MarketContext> {
  const ticker = (await client.market.getTickers({ symbol })).list[0];
  if (!ticker) throw new Error(`Ticker not found for symbol ${symbol}`);

  let bestBidRaw = ticker.best_bid_price;
  let bestAskRaw = ticker.best_ask_price;
  try {
    const orderbook = await client.market.getOrderbook({ symbol, limit: 1 });
    bestBidRaw = orderbook.result.b[0]?.[0] ?? bestBidRaw;
    bestAskRaw = orderbook.result.a[0]?.[0] ?? bestAskRaw;
  } catch {
    // local image may not expose orderbook route
  }

  const fallbackPrice =
    ticker.last_price !== "0"
      ? ticker.last_price
      : ticker.mark_price !== "0"
        ? ticker.mark_price
        : ticker.index_price;
  if (!bestBidRaw || bestBidRaw === "0") bestBidRaw = fallbackPrice;
  if (!bestAskRaw || bestAskRaw === "0") bestAskRaw = fallbackPrice;

  return {
    symbol,
    instrument,
    mark: parseNumber(ticker.mark_price, `${symbol}.mark_price`),
    index: parseNumber(ticker.index_price, `${symbol}.index_price`),
    last: parseNumber(ticker.last_price, `${symbol}.last_price`),
    bestBid: parseNumber(bestBidRaw, `${symbol}.best_bid`),
    bestAsk: parseNumber(bestAskRaw, `${symbol}.best_ask`),
    tickSize: parseNumber(
      instrument.price_filter.tick_size,
      `${symbol}.tick_size`,
    ),
    tickDecimals: decimalPlaces(instrument.price_filter.tick_size),
    qtyStep: parseNumber(
      instrument.lot_size_filter.qty_step,
      `${symbol}.qty_step`,
    ),
    qtyDecimals: decimalPlaces(instrument.lot_size_filter.qty_step),
  };
}

function priceAt(
  ctx: MarketContext,
  base: number,
  mode: "up" | "down",
): string {
  return fmt(
    roundToStep(Math.max(base, ctx.tickSize), ctx.tickSize, mode),
    ctx.tickDecimals,
  );
}

function pickQty(ctx: MarketContext): string {
  const minQty = parseNumber(
    ctx.instrument.lot_size_filter.min_order_qty,
    "min_order_qty",
  );
  const candidate = env.TRIGGER_QTY
    ? parseNumber(env.TRIGGER_QTY, "TRIGGER_QTY")
    : minQty * 2;
  return fmt(
    roundToStep(Math.max(minQty, candidate), ctx.qtyStep, "up"),
    ctx.qtyDecimals,
  );
}

async function placeLiquidity(
  trader: Trader,
  symbol: string,
  side: Side,
  price: string,
  qty: string,
): Promise<void> {
  await trader.client.trade.placeOrder({
    sub_account_address: trader.subAccount,
    symbol,
    side,
    order_type: "Limit",
    qty,
    price,
    margin_mode: "Cross",
    time_in_force: "GTC",
    order_link_id: uniqueLink("liq"),
    post_only: false,
    reduce_only: false,
    close_on_trigger: false,
  });
}

async function placeStopOrder(
  trader: Trader,
  params: PlaceStopParams,
): Promise<{ orderId: string; link: string }> {
  const response = await trader.client.trade.placeOrder({
    sub_account_address: trader.subAccount,
    symbol: params.symbol,
    side: params.side,
    order_type: params.orderType,
    qty: params.qty,
    price: params.price,
    margin_mode: "Cross",
    time_in_force: params.orderType === "Market" ? "IOC" : "GTC",
    order_link_id: params.orderLinkId,
    post_only: false,
    reduce_only: false,
    close_on_trigger: false,
    trigger: {
      trigger_price: params.triggerPrice,
      trigger_direction: params.triggerDirection,
      trigger_by: params.triggerBy,
    },
  });
  return {
    orderId: response.order_id,
    link: response.order_link_id ?? params.orderLinkId,
  };
}

async function orderByLink(
  trader: Trader,
  symbol: string,
  orderLinkId: string,
  orderFilter?: string,
): Promise<Order> {
  const history = await trader.client.trade.getOrderHistory({
    sub_account_address: trader.subAccount,
    symbol,
    order_link_id: orderLinkId,
    order_filter: orderFilter,
    limit: 20,
  });
  if (history.list.length === 0) {
    throw new Error(`Order not found by order_link_id=${orderLinkId}`);
  }
  return history.list[0];
}

async function waitOrderStatus(
  trader: Trader,
  symbol: string,
  orderLinkId: string,
  expected: string[],
  orderFilter = "StopOrder",
  timeoutMs = TIMEOUT.order,
): Promise<Order> {
  return eventually(
    `waitForOrderStatus(${orderLinkId} -> ${expected.join("|")})`,
    () => orderByLink(trader, symbol, orderLinkId, orderFilter),
    (order) => expected.includes(order.order_status),
    { timeoutMs },
  );
}

async function assertSingleRowContinuity(
  trader: Trader,
  symbol: string,
  orderLinkId: string,
): Promise<Order> {
  const history = await trader.client.trade.getOrderHistory({
    sub_account_address: trader.subAccount,
    symbol,
    order_link_id: orderLinkId,
    limit: 20,
  });
  if (history.list.length !== 1) {
    throw new Error(
      `Expected exactly one history row for order_link_id=${orderLinkId}, got ${history.list.length}`,
    );
  }
  return history.list[0];
}

async function runStopMarketFilled(
  traderA: Trader,
  traderX: Trader,
  ctx: MarketContext,
  params: {
    side: Side;
    triggerBy: TriggerBy;
    triggerDirection: TriggerDirection;
    triggerRef: number;
    qty: string;
    linkTag: string;
  },
): Promise<string> {
  const isBuy = params.side === "Buy";
  const makerSide: Side = isBuy ? "Sell" : "Buy";
  const makerPrice = priceAt(
    ctx,
    isBuy
      ? Math.max(ctx.bestAsk, ctx.mark) * 1.002
      : Math.min(ctx.bestBid, ctx.mark) * 0.998,
    isBuy ? "up" : "down",
  );
  await placeLiquidity(traderX, ctx.symbol, makerSide, makerPrice, params.qty);

  const link = uniqueLink(params.linkTag);
  const triggerPrice =
    params.triggerDirection === "Up"
      ? priceAt(ctx, params.triggerRef * 0.98, "down")
      : priceAt(ctx, params.triggerRef * 1.02, "up");

  await placeStopOrder(traderA, {
    symbol: ctx.symbol,
    side: params.side,
    orderType: "Market",
    qty: params.qty,
    price: "0",
    orderLinkId: link,
    triggerBy: params.triggerBy,
    triggerDirection: params.triggerDirection,
    triggerPrice,
  });

  await waitOrderStatus(traderA, ctx.symbol, link, ["Filled"]);
  return link;
}

export async function runTriggerExample(): Promise<void> {
  const takerPk =
    env.PK ?? (NETWORK === "local" ? env.APTOS_E2E_PRIVATE_KEY : undefined);
  const makerPk =
    env.PK_MAKER ??
    (NETWORK === "local" ? env.APTOS_E2E_SUB_PRIVATE_KEY : undefined);
  if (!takerPk) throw new Error("Missing PK (Trader A root private key).");
  if (!makerPk)
    throw new Error("Missing PK_MAKER (Trader X root private key).");
  if (takerPk === makerPk)
    throw new Error("PK and PK_MAKER must be different accounts.");

  if (LOCAL_AUTO_BOOTSTRAP) {
    section("Local Bootstrap");
    await bootstrapLocalTrader("A", takerPk);
    await bootstrapLocalTrader("X", makerPk);
  }

  section("Authenticating Traders");
  const [aAuth, xAuth] = await Promise.all([
    authorizeClient("Trader A", takerPk),
    authorizeClient("Trader X", makerPk),
  ]);

  await aAuth.client.setTokens({
    rest: aAuth.token,
    ws: aAuth.token,
    connectPrivateWS: true,
  });
  xAuth.client.setToken(xAuth.token);

  const [aSub, xSub] = await Promise.all([
    resolveTradingSubAccount(
      aAuth.client,
      env.TRIGGER_SUB_ACCOUNT_A,
      aAuth.suggestedTradingSub,
      "A",
    ),
    resolveTradingSubAccount(
      xAuth.client,
      env.TRIGGER_SUB_ACCOUNT_B,
      xAuth.suggestedTradingSub,
      "B",
    ),
  ]);

  const traderA: Trader = { client: aAuth.client, subAccount: aSub };
  const traderX: Trader = { client: xAuth.client, subAccount: xSub };
  console.log(`Trader A sub-account: ${traderA.subAccount}`);
  console.log(`Trader X sub-account: ${traderX.subAccount}`);

  section("Selecting Symbol");
  const instrumentsResp = await traderA.client.market.getInstrumentsInfo();
  const instrumentBySymbol = new Map(
    instrumentsResp.list.map((item) => [item.symbol, item]),
  );
  const tickers = await traderA.client.market.getTickers();
  let symbol = env.SYMBOL;
  if (!symbol) {
    const preferred = tickers.list
      .map((t) => {
        const instrument = instrumentBySymbol.get(t.symbol);
        if (!instrument) return null;
        const mark = parseNumber(t.mark_price, `${t.symbol}.mark_price`);
        const index = parseNumber(t.index_price, `${t.symbol}.index_price`);
        const tick = parseNumber(
          instrument.price_filter.tick_size,
          `${t.symbol}.tick_size`,
        );
        return { symbol: t.symbol, spread: Math.abs(mark - index), tick };
      })
      .filter((v): v is { symbol: string; spread: number; tick: number } =>
        Boolean(v),
      )
      .sort((a, b) => b.spread - a.spread);
    symbol =
      preferred.find((m) => m.spread >= m.tick)?.symbol ?? preferred[0]?.symbol;
  }
  if (!symbol)
    throw new Error("Could not pick a symbol. Set SYMBOL explicitly.");

  const instrument = instrumentBySymbol.get(symbol);
  if (!instrument)
    throw new Error(`Instrument info missing for symbol ${symbol}`);

  let market = await loadMarketContext(traderA.client, symbol, instrument);
  const qty = pickQty(market);
  console.log(
    `Using ${market.symbol}: mark=${market.mark}, index=${market.index}, last=${market.last}, tick=${market.tickSize}`,
  );
  console.log(`Using test quantity: ${qty}`);

  const wsTriggerOrders: Order[] = [];
  const wsPositionEvents: Position[] = [];
  const wsExecutions: Array<{
    symbol?: string;
    order_id?: string;
    side?: string;
    exec_qty?: string;
    exec_price?: string;
  }> = [];

  const unsubscribeOrder = traderA.client.privateStream?.subscribeOrder(
    (rows) => {
      if (!Array.isArray(rows)) return;
      for (const raw of rows) {
        const row = raw as Order;
        if (row.symbol !== market.symbol) continue;
        if (!isConditionalOrder(row)) continue;
        wsTriggerOrders.push(row);
        if (LOG_TRIGGER_WS) {
          printWsOrder(row);
        }
      }
    },
  );

  const unsubscribeExecution = traderA.client.privateStream?.subscribeExecution(
    (rows) => {
      if (!Array.isArray(rows)) return;
      for (const raw of rows as Array<Record<string, unknown>>) {
        if (raw.symbol !== market.symbol) continue;
        wsExecutions.push({
          symbol: typeof raw.symbol === "string" ? raw.symbol : undefined,
          order_id: typeof raw.order_id === "string" ? raw.order_id : undefined,
          side: typeof raw.side === "string" ? raw.side : undefined,
          exec_qty: typeof raw.exec_qty === "string" ? raw.exec_qty : undefined,
          exec_price:
            typeof raw.exec_price === "string" ? raw.exec_price : undefined,
        });
        if (LOG_TRIGGER_WS) {
          console.log(
            `[WS][execution] symbol=${String(raw.symbol)} order_id=${String(raw.order_id)} side=${String(raw.side)} qty=${String(raw.exec_qty)} price=${String(raw.exec_price)}`,
          );
        }
      }
    },
  );

  const unsubscribePosition = traderA.client.privateStream?.subscribePosition(
    (rows) => {
      if (!Array.isArray(rows)) return;
      for (const row of rows as Position[]) {
        if (row.symbol !== market.symbol) continue;
        wsPositionEvents.push(row);
        if (LOG_TRIGGER_WS) {
          console.log(
            `[WS][position] symbol=${row.symbol} size=${row.size} tp=${row.take_profit ?? "-"} sl=${row.stop_loss ?? "-"} ts=${row.trailing_stop ?? "-"}`,
          );
        }
      }
    },
  );

  try {
    section("1) Stop-Market Buy (MarkPrice) -> Filled");
    const stopBuyLink = await runStopMarketFilled(traderA, traderX, market, {
      side: "Buy",
      triggerBy: "MarkPrice",
      triggerDirection: "Up",
      triggerRef: market.mark,
      qty,
      linkTag: "a-stop-mkt-buy-mark",
    });
    const filled = await orderByLink(
      traderA,
      market.symbol,
      stopBuyLink,
      "StopOrder",
    );
    assert(filled.stop_order_type === "Stop", "Expected stop_order_type=Stop");
    const row = await assertSingleRowContinuity(
      traderA,
      market.symbol,
      stopBuyLink,
    );
    assert(
      row.order_status === "Filled",
      "Expected single-row history continuity ending in Filled",
    );
    await sleep(500);
    const rowAfter = await assertSingleRowContinuity(
      traderA,
      market.symbol,
      stopBuyLink,
    );
    assert(
      rowAfter.order_status === "Filled" && rowAfter.order_id === row.order_id,
      "Expected idempotent single-fire behavior",
    );

    section("2) Stop-Market Sell (MarkPrice) -> Filled");
    market = await loadMarketContext(traderA.client, market.symbol, instrument);
    await runStopMarketFilled(traderA, traderX, market, {
      side: "Sell",
      triggerBy: "MarkPrice",
      triggerDirection: "Down",
      triggerRef: market.mark,
      qty,
      linkTag: "a-stop-mkt-sell-mark",
    });

    section("3) Stop-Limit Buy (MarkPrice) -> New");
    market = await loadMarketContext(traderA.client, market.symbol, instrument);
    const stopLimitLink = uniqueLink("a-stop-lmt-buy-mark");
    await placeStopOrder(traderA, {
      symbol: market.symbol,
      side: "Buy",
      orderType: "Limit",
      qty,
      price: priceAt(market, market.bestBid * 0.98, "down"),
      orderLinkId: stopLimitLink,
      triggerBy: "MarkPrice",
      triggerDirection: "Up",
      triggerPrice: priceAt(market, market.mark * 0.98, "down"),
    });
    await waitOrderStatus(traderA, market.symbol, stopLimitLink, ["New"]);

    section("4) Cancel Untriggered Conditional (order_id + order_link_id)");
    market = await loadMarketContext(traderA.client, market.symbol, instrument);
    const cancelByIdLink = uniqueLink("a-stop-cancel-by-id");
    const byId = await placeStopOrder(traderA, {
      symbol: market.symbol,
      side: "Buy",
      orderType: "Limit",
      qty,
      price: priceAt(market, market.bestBid * 0.97, "down"),
      orderLinkId: cancelByIdLink,
      triggerBy: "MarkPrice",
      triggerDirection: "Up",
      triggerPrice: priceAt(
        market,
        Math.max(market.mark, market.last) * 1.25,
        "up",
      ),
    });
    await waitOrderStatus(traderA, market.symbol, cancelByIdLink, [
      "Untriggered",
    ]);
    await traderA.client.trade.cancelOrder({
      sub_account_address: traderA.subAccount,
      symbol: market.symbol,
      order_id: byId.orderId,
    });
    await waitOrderStatus(traderA, market.symbol, cancelByIdLink, ["Canceled"]);

    const cancelByLinkLink = uniqueLink("a-stop-cancel-by-link");
    await placeStopOrder(traderA, {
      symbol: market.symbol,
      side: "Buy",
      orderType: "Limit",
      qty,
      price: priceAt(market, market.bestBid * 0.97, "down"),
      orderLinkId: cancelByLinkLink,
      triggerBy: "MarkPrice",
      triggerDirection: "Up",
      triggerPrice: priceAt(
        market,
        Math.max(market.mark, market.last) * 1.25,
        "up",
      ),
    });
    await waitOrderStatus(traderA, market.symbol, cancelByLinkLink, [
      "Untriggered",
    ]);
    await traderA.client.trade.cancelOrder({
      sub_account_address: traderA.subAccount,
      symbol: market.symbol,
      order_link_id: cancelByLinkLink,
    });
    await waitOrderStatus(traderA, market.symbol, cancelByLinkLink, [
      "Canceled",
    ]);

    section("5) StopOrder Filter Semantics");
    market = await loadMarketContext(traderA.client, market.symbol, instrument);
    const activeLink = uniqueLink("a-active-filter-check");
    const stopLink = uniqueLink("a-stop-filter-check");
    await traderA.client.trade.placeOrder({
      sub_account_address: traderA.subAccount,
      symbol: market.symbol,
      side: "Buy",
      order_type: "Limit",
      qty,
      price: priceAt(market, market.bestBid * 0.95, "down"),
      margin_mode: "Cross",
      time_in_force: "GTC",
      order_link_id: activeLink,
      post_only: false,
      reduce_only: false,
      close_on_trigger: false,
    });
    await placeStopOrder(traderA, {
      symbol: market.symbol,
      side: "Buy",
      orderType: "Limit",
      qty,
      price: priceAt(market, market.bestBid * 0.96, "down"),
      orderLinkId: stopLink,
      triggerBy: "MarkPrice",
      triggerDirection: "Up",
      triggerPrice: priceAt(
        market,
        Math.max(market.mark, market.last) * 1.2,
        "up",
      ),
    });
    await waitOrderStatus(traderA, market.symbol, stopLink, ["Untriggered"]);
    const filtered = await traderA.client.trade.getOrderHistory({
      sub_account_address: traderA.subAccount,
      symbol: market.symbol,
      order_filter: "StopOrder",
      limit: 200,
    });
    const links = new Set(filtered.list.map((o) => o.order_link_id ?? ""));
    assert(
      links.has(stopLink),
      "StopOrder filter must include stop conditional order",
    );
    assert(
      !links.has(activeLink),
      "StopOrder filter must exclude regular active order",
    );

    section("6) Trigger Source Routing (IndexPrice strict check)");
    market = await loadMarketContext(traderA.client, market.symbol, instrument);
    const markIndexGap = Math.abs(market.mark - market.index);
    if (markIndexGap < market.tickSize) {
      const message = `Cannot prove IndexPrice routing on ${market.symbol}: mark/index gap (${markIndexGap}) < tick (${market.tickSize}).`;
      if (STRICT_TRIGGER_SOURCE) {
        throw new Error(
          `${message} Set SYMBOL to a market with mark/index divergence or set STRICT_TRIGGER_SOURCE=false.`,
        );
      }
      console.warn(`${message} Skipping strict non-fire sentinel.`);
    } else {
      const markAboveIndex = market.mark > market.index;
      const sentinelDirection: TriggerDirection = markAboveIndex
        ? "Up"
        : "Down";
      const sentinelSide: Side = markAboveIndex ? "Buy" : "Sell";
      const sentinelTrigger = priceAt(
        market,
        markAboveIndex
          ? market.index + market.tickSize
          : market.index - market.tickSize,
        markAboveIndex ? "up" : "down",
      );
      const sentinelLink = uniqueLink("a-stop-index-sentinel");
      await placeStopOrder(traderA, {
        symbol: market.symbol,
        side: sentinelSide,
        orderType: "Market",
        qty,
        price: "0",
        orderLinkId: sentinelLink,
        triggerBy: "IndexPrice",
        triggerDirection: sentinelDirection,
        triggerPrice: sentinelTrigger,
      });
      const sentinel = await waitOrderStatus(
        traderA,
        market.symbol,
        sentinelLink,
        ["Untriggered"],
        "StopOrder",
        TIMEOUT.short,
      );
      assert(
        sentinel.order_status === "Untriggered",
        "IndexPrice sentinel must stay Untriggered",
      );
      await traderA.client.trade.cancelOrder({
        sub_account_address: traderA.subAccount,
        symbol: market.symbol,
        order_link_id: sentinelLink,
      });
    }
    await runStopMarketFilled(traderA, traderX, market, {
      side: "Buy",
      triggerBy: "IndexPrice",
      triggerDirection: "Up",
      triggerRef: market.index,
      qty,
      linkTag: "a-stop-index-fire",
    });

    section("7) LastPrice Trigger Path -> Filled");
    market = await loadMarketContext(traderA.client, market.symbol, instrument);
    await runStopMarketFilled(traderA, traderX, market, {
      side: "Buy",
      triggerBy: "LastPrice",
      triggerDirection: "Up",
      triggerRef: market.last > 0 ? market.last : market.mark,
      qty,
      linkTag: "a-stop-last-fire",
    });

    section("8) SetTradingStop -> TP/SL Untriggered Orders + Position WS");
    market = await loadMarketContext(traderA.client, market.symbol, instrument);
    await placeLiquidity(
      traderX,
      market.symbol,
      "Sell",
      priceAt(market, Math.max(market.bestAsk, market.mark) * 1.001, "up"),
      qty,
    );
    await traderA.client.trade.placeOrder({
      sub_account_address: traderA.subAccount,
      symbol: market.symbol,
      side: "Buy",
      order_type: "Market",
      qty,
      price: "0",
      margin_mode: "Cross",
      time_in_force: "IOC",
      order_link_id: uniqueLink("a-open-long"),
      post_only: false,
      reduce_only: false,
      close_on_trigger: false,
    });

    await eventually(
      "waitForOpenPosition",
      async () => {
        const resp = await traderA.client.position.getPositionInfo({
          sub_account_address: traderA.subAccount,
          symbol: market.symbol,
          limit: 20,
        });
        return (
          resp.list.find(
            (p) =>
              p.symbol === market.symbol &&
              parseNumber(p.size, "position.size") > 0,
          ) ?? null
        );
      },
      (position) => position !== null,
      { timeoutMs: TIMEOUT.position, intervalMs: 400 },
    );

    const before = await traderA.client.trade.getOrderHistory({
      sub_account_address: traderA.subAccount,
      symbol: market.symbol,
      order_filter: "TpSlOrder",
      limit: 200,
    });
    const beforeIds = new Set(before.list.map((o) => o.order_id));
    const tp = priceAt(market, market.last * 1.03, "up");
    const sl = priceAt(market, market.last * 0.97, "down");

    const setStop = await traderA.client.position.setTradingStop({
      sub_account_address: traderA.subAccount,
      symbol: market.symbol,
      tpsl: {
        mode: "Full",
        take_profit: { market: { trigger_price: tp, trigger_by: "LastPrice" } },
        stop_loss: { market: { trigger_price: sl, trigger_by: "LastPrice" } },
      },
    });
    assert(setStop.success, "setTradingStop should return success=true");

    await eventually(
      "waitForPositionUpdate",
      async () => {
        const wsEvent =
          [...wsPositionEvents]
            .reverse()
            .find((p) => p.symbol === market.symbol) ?? null;
        const restPosition = await traderA.client.position.getPositionInfo({
          sub_account_address: traderA.subAccount,
          symbol: market.symbol,
          limit: 20,
        });
        const restEvent =
          restPosition.list.find((p) => p.symbol === market.symbol) ?? null;
        return { wsEvent, restEvent };
      },
      (events) => {
        const wsOk =
          events.wsEvent !== null &&
          approxEqString(events.wsEvent.take_profit, tp) &&
          approxEqString(events.wsEvent.stop_loss, sl);
        const restOk =
          events.restEvent !== null &&
          approxEqString(events.restEvent.take_profit, tp) &&
          approxEqString(events.restEvent.stop_loss, sl);
        return wsOk || restOk;
      },
      { timeoutMs: TIMEOUT.position, intervalMs: 300 },
    );

    const after = await eventually(
      "waitForTpSlOrders",
      () =>
        traderA.client.trade.getOrderHistory({
          sub_account_address: traderA.subAccount,
          symbol: market.symbol,
          order_filter: "TpSlOrder",
          limit: 200,
        }),
      (resp) =>
        resp.list.filter(
          (o) =>
            !beforeIds.has(o.order_id) &&
            o.order_status === "Untriggered" &&
            o.side === "Sell",
        ).length >= 2,
      { timeoutMs: TIMEOUT.position, intervalMs: 400 },
    );
    const freshUntriggered = after.list.filter(
      (o) => !beforeIds.has(o.order_id) && o.order_status === "Untriggered",
    );
    assert(
      freshUntriggered.length >= 2,
      "Expected at least two new TP/SL untriggered orders",
    );

    const wsStatuses = [
      ...new Set(wsTriggerOrders.map((o) => o.order_status)),
    ].sort();
    console.log(
      `[WS][summary] trigger_orders=${wsTriggerOrders.length} statuses=${wsStatuses.join(",") || "none"} executions=${wsExecutions.length} position_updates=${wsPositionEvents.length}`,
    );

    section("Done");
    console.log(`Trigger conformance flow completed on ${market.symbol}.`);
  } finally {
    if (unsubscribePosition) unsubscribePosition();
    if (unsubscribeOrder) unsubscribeOrder();
    if (unsubscribeExecution) unsubscribeExecution();
    traderA.client.close();
    traderX.client.close();
  }
}

if (import.meta.main) {
  await runTriggerExample();
  process.exit(0);
}
