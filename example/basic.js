// Basic example: authenticate, place a limit order intent, cancel it, and optionally listen on the private WS.
//
// What this script demonstrates
// - Building an Aptos Ed25519 account (AIP-80 compliant formatting)
// - Authorizing with the Ekiden Gateway by signing: "AUTHORIZE|{timestamp_ms}|{nonce}"
// - Building and signing an order intent via buildOrderPayload, sending with commit
// - Extracting the order SID and sending a cancel intent
// - Subscribing to private order updates over WebSocket
//
// Prerequisites
// - Node 20+ recommended
// - From ts-sdk/, build the package first so ../dist exists: `npm run build`
//
// Required env (provide ONE of):
//   PK=0x<root_owner_ed25519_private_key_hex>
//   or
//   TRADING_PK=0x<trading_sub_ed25519_private_key_hex>
//
// Optional env for convenience:
//   MARKET_ADDR=0x<market_address_on_staging>   # if not set, the script fetches markets and picks one (or by SYMBOL)
//   SYMBOL=BTC-WUSDC                            # select market by symbol when MARKET_ADDR is not provided
//   SIDE=buy|sell                               # default: buy
//   PRICE=50000000000                           # integer scaled quote price
//   SIZE=10                                     # integer base size
//   LEVERAGE=1                                  # integer leverage
//   IS_CROSS=true|false                         # boolean; true=cross, false=isolated (default: true)
//   ENABLE_PRIVATE_WS=true|false                # listen for private order updates (default: true)
//
// IMPORTANT
// - Use the Ekiden web UI to create/restore your root account and trading sub-account.
// - Deposit funds into the appropriate vault (asset of your chosen market) via the UI.
// - Link accounts if prompted. This script does not perform deposits or account creation.
//
// Notes
// - The client is initialized with TESTNET (staging) config. TESTNET includes apiPrefix ("/api/v1"),
//   so baseURL stays as host root and the SDK automatically targets versioned routes.
// - The example uses the trading sub-account for both authorization and intent signing. If only PK
//   is provided, the script deterministically derives the trading sub-account using the same message
//   format as the app.
// - No deposits or on-chain flows here; use the Ekiden UI to fund and link accounts beforehand.

import "dotenv/config";
import { Ed25519Account, Ed25519PrivateKey, PrivateKey } from "@aptos-labs/ts-sdk";
import { EkidenClient, TESTNET, buildOrderPayload } from "../dist/index.js";

// ========= Config (edit here) =========
const CONFIG = {
  // Market address to trade (copy from the app)
  MARKET_ADDR: process.env.MARKET_ADDR || "0x<replace_with_market_addr>",

  // Order params
  SIDE: (process.env.SIDE || "buy").toLowerCase(), // "buy" | "sell"
  PRICE: Number(process.env.PRICE || "50000000000"), // integer price (quote units)
  SIZE: Number(process.env.SIZE || "10"), // integer base size
  LEVERAGE: Number(process.env.LEVERAGE || "1"), // leverage (default 1)
  IS_CROSS: String(process.env.IS_CROSS || "true").toLowerCase() === "true",  // cross by default

  // Derivation from owner key (if PK provided)
  TRADING_NONCE: process.env.TRADING_NONCE || "0", // which trading sub-account (default 0)
  // AIP-21 style canonical derivation message
  derivationMessage: (rootAddr, nonce) => `APTOS\nmessage: Ekiden Trading\nnonce: ${rootAddr.toLowerCase()}Tradingv2${nonce}`,

  // Whether to open private WS for order updates
  ENABLE_PRIVATE_WS: String(process.env.ENABLE_PRIVATE_WS || "true").toLowerCase() === "true",
};

// Small helpers
const hexWithout0x = (h) => (h?.startsWith("0x") ? h.slice(2) : h || "");
const hexToBytes = (hex) => {
  const clean = hexWithout0x(hex);
  if (clean.length % 2 !== 0) throw new Error("Invalid hex");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
};
const bytesToHex = (bytes) => "0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const nowMs = () => Date.now();
const randomNonce = () => Math.random().toString(36).slice(2);

// Normalize private key to AIP-80 ed25519 format (enforced with PrivateKey.formatPrivateKey)
function normalizeSecretKey(pkHex) {
  if (!pkHex) throw new Error("Missing private key");
  const raw = hexWithout0x(String(pkHex).trim());
  const hex64 = raw.length === 128 ? raw.slice(0, 64) : raw;
  const with0x = "0x" + hex64;
  // Ensure AIP-80 compliant formatting
  return PrivateKey.formatPrivateKey(with0x, "ed25519");
}

// Sign AUTHORIZE message (format: AUTHORIZE|{timestamp_ms}|{nonce})
function signAuthorize(account, timestampMs, nonce) {
  const msg = `AUTHORIZE|${timestampMs}|${nonce}`;
  const sigHex = account.sign(new TextEncoder().encode(msg)).toString();
  return sigHex.startsWith("0x") ? sigHex : "0x" + sigHex;
}

// Sign intent payload
function signIntent(account, actionPayload, nonceNumber) {
  const hex = buildOrderPayload({ payload: actionPayload, nonce: nonceNumber });
  const bytes = hexToBytes(hex);
  const sigHex = account.sign(bytes).toString();
  return sigHex.startsWith("0x") ? sigHex : "0x" + sigHex;
}

// Derive trading sub-account from owner account (same AIP-21-like message format used by the app)
function deriveTradingAccount(ownerAccount, rootAddress, tradingNonce = "0") {
  const msg = CONFIG.derivationMessage(rootAddress, tradingNonce);
  const sigHex = ownerAccount.sign(new TextEncoder().encode(msg)).toString();
  const seed32 = hexToBytes(sigHex).slice(0, 32);
  const formatted = PrivateKey.formatPrivateKey(bytesToHex(seed32), "ed25519");
  return new Ed25519Account({ privateKey: new Ed25519PrivateKey(formatted) });
}

// Pick a market address to trade (explicit MARKET_ADDR -> SYMBOL -> first market)
async function resolveMarket(client) {
  // If explicitly set and not a placeholder, use it
  if (CONFIG.MARKET_ADDR && !CONFIG.MARKET_ADDR.includes("<replace_")) {
    return { addr: CONFIG.MARKET_ADDR, market: undefined };
  }

  const SYMBOL = process.env.SYMBOL?.trim();
  const markets = await client.httpApi.getMarkets();
  if (!Array.isArray(markets) || markets.length === 0) {
    throw new Error("No markets available on staging");
  }
  let chosen = markets[0];
  if (SYMBOL) {
    const bySymbol = markets.find((m) => String(m.symbol || "").toLowerCase() === SYMBOL.toLowerCase());
    if (bySymbol) chosen = bySymbol;
  }
  const addr = chosen.addr || chosen.address || chosen.market_addr;
  if (!addr) {
    throw new Error("Could not determine market address; set MARKET_ADDR env");
  }
  console.log(`Selected market ${chosen.symbol || "(unknown)"}: ${addr}`);
  return { addr, market: chosen };
}

async function main() {
  const PK = process.env.PK;
  const TRADING_PK = process.env.TRADING_PK;
  if (!PK && !TRADING_PK) {
    console.error("Provide PK=0x... (owner) or TRADING_PK=0x... (trading).");
    process.exit(1);
  }

  // Build accounts
  const rootAcc = PK ? new Ed25519Account({ privateKey: new Ed25519PrivateKey(normalizeSecretKey(PK)) }) : null;
  const tradingAcc = TRADING_PK
    ? new Ed25519Account({ privateKey: new Ed25519PrivateKey(normalizeSecretKey(TRADING_PK)) })
    : rootAcc
      ? deriveTradingAccount(rootAcc, rootAcc.accountAddress.toString(), CONFIG.TRADING_NONCE)
      : null;
  const signingAccount = tradingAcc || rootAcc;
  if (!signingAccount) throw new Error("Failed to resolve signing account");

  const userAddr = tradingAcc?.accountAddress.toString();
  console.log("Root Account:", rootAcc?.accountAddress.toString() || "(none)");
  console.log("Trading Account:", tradingAcc?.accountAddress.toString() || "(none)");

  // Init client
  const client = new EkidenClient({
    baseURL: TESTNET.baseURL,
    wsURL: TESTNET.wsURL,
    privateWSURL: TESTNET.privateWSURL,
    apiPrefix: TESTNET.apiPrefix,
    // baseURL: "http://127.0.0.1:3010",
    // wsURL: "ws://127.0.0.1:3010/ws/public",
    // privateWSURL: "ws://127.0.0.1:3010/ws/private",
    // apiPrefix: "/api/v1",
  });

  // Authorize
  const authTs = nowMs();
  const authNonce = randomNonce();
  const authSig = signAuthorize(signingAccount, authTs, authNonce);
  const tokenResp = await client.httpApi.authorize({
    public_key: signingAccount.publicKey.toString(),
    timestamp_ms: authTs,
    nonce: authNonce,
    signature: authSig,
  });
  await client.setToken(tokenResp.token);
  console.log("Authorized as:", signingAccount.accountAddress.toString());
  // console.log("Bearer token:", tokenResp.token);

  // Optional private WS: prints any order updates pushed to your authenticated channel
  if (CONFIG.ENABLE_PRIVATE_WS) {
    try {
      client.subscribeToOrders((orders) => {
        console.log("[private-ws] orders:", JSON.stringify(orders, null, 2));
      });
    } catch (e) {
      console.warn("Private WS unavailable:", e?.message || e);
    }
  }

  // Resolve market address
  const { addr: marketAddr } = await resolveMarket(client);

  // Build order_create
  // Tip: Ensure your trading account has sufficient asset balance in the vault; otherwise the
  // order may be rejected or not placed. Fund via the Ekiden UI before running this example.
  const createNonce = Date.now();
  const createPayload = {
    type: "order_create",
    orders: [
      {
        market_addr: marketAddr,
        side: CONFIG.SIDE,
        size: CONFIG.SIZE,
        price: CONFIG.PRICE,
        leverage: CONFIG.LEVERAGE,
        type: "limit",
        is_cross: CONFIG.IS_CROSS,
        time_in_force: "GTC", // alternatives: "GTC", "IOC", "FOK"
        // Optional: conditional trigger price, reduce-only, link id
        // trigger_price: price, // example
        // reduce_only: true,
        // order_link_id: "example-123",
        // TP/SL bracket
        bracket: {
          mode: "FULL",
          take_profit: { trigger_price: Math.max(1, CONFIG.PRICE + Math.floor(CONFIG.PRICE * 0.02)), order_type: "MARKET" },
          stop_loss: { trigger_price: Math.max(1, CONFIG.PRICE - Math.floor(CONFIG.PRICE * 0.02)), order_type: "LIMIT", limit_price: Math.max(1, CONFIG.PRICE - Math.floor(CONFIG.PRICE * 0.02)) },
        },
      },
    ],
  };
  const createSig = signIntent(signingAccount, createPayload, createNonce);
  const createReq = {
    payload: createPayload,
    nonce: createNonce,
    signature: createSig,
  };
  console.log("Create request:", JSON.stringify(createReq, null, 2));
  const created = await client.httpApi.sendIntentWithCommit(createReq);
  console.log("Create response:", JSON.stringify(created, null, 2));

  // Extract SID
  let createdSid = undefined;
  if (created?.output?.type === "order_create" && Array.isArray(created.output.outputs)) {
    createdSid = created.output.outputs[0]?.sid;
  }

  const orders = await client.httpApi.getOrders({ user_addr: userAddr });
  console.log("Fetched Orders:", JSON.stringify(orders, null, 2));
  if (!orders[0].take_profit || !orders[0].stop_loss) {
    console.error("Order does not have TP/SL:", JSON.stringify(orders[0], null, 2));
    process.exit(1);
  } else {
    console.log("Order has TP/SL:", JSON.stringify(orders[0], null, 2));
  }

  if (!createdSid) {
    console.warn("No order SID returned; skipping cancel.");
  } else {
    const cancelNonce = Date.now();
    const cancelPayload = { type: "order_cancel", cancels: [{ sid: createdSid }] };
    const cancelSig = signIntent(signingAccount, cancelPayload, cancelNonce);
    const cancelReq = { payload: cancelPayload, nonce: cancelNonce, signature: cancelSig, ...(userAddr ? { user_addr: userAddr } : {}) };
    console.log("Cancel request:", JSON.stringify(cancelReq, null, 2));
    const cancelled = await client.httpApi.sendIntentWithCommit(cancelReq);
    console.log("Cancel response:", JSON.stringify(cancelled, null, 2));
  }

  // Flush WS events (optional) and exit
  await new Promise((r) => setTimeout(r, 1000));
  try { client.privateWS?.close(); } catch { }
  try { client.wsApi?.close(); } catch { }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

