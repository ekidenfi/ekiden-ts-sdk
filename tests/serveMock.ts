import type {
  PlaceOrderRequest,
  AmendOrderRequest,
  CancelOrderRequest,
  BatchPlaceOrdersRequest,
  BatchAmendOrdersRequest,
  BatchCancelOrdersRequest,
} from "../src/types/api";

const PORT = 3456;

const mockAccountBalance = {
  list: [
    {
      user_id: "user-001",
      user_addr: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      vault_addr: "0xvault1234567890abcdef1234567890abcdef1234567890abcdef12345678",
      equity: "10000.00",
      wallet_balance: "9500.00",
      margin_balance: "10000.00",
      available_balance: "8500.00",
      accrued_interest: "0.00",
      total_order_im: "500.00",
      total_position_im: "1000.00",
      total_position_mm: "500.00",
      unrealised_pnl: "250.00",
      unrealized_funding: "10.00",
      realised_pnl_cum: "150.00",
    },
  ],
};

const mockTickers = {
  list: [
    {
      symbol: "BTCUSDC",
      last_price: "43250.50",
      index_price: "43248.00",
      mark_price: "43250.00",
      prev_price_24h: "42800.00",
      high_price_24h: "43500.00",
      low_price_24h: "42500.00",
      prev_price_1h: "43100.00",
      volume_24h: "1250.5",
      turnover_24h: "54000000.00",
      open_interest: "15000000.00",
      open_interest_volume: "347.82",
      funding_rate: "0.0001",
      next_funding_time: String(Date.now() + 3600000),
      best_ask_size: "0.3",
      best_ask_price: "43251.00",
      best_bid_size: "0.5",
      best_bid_price: "43249.00",
    },
    {
      symbol: "ETHUSDC",
      last_price: "2650.00",
      index_price: "2649.00",
      mark_price: "2650.00",
      prev_price_24h: "2620.00",
      high_price_24h: "2680.00",
      low_price_24h: "2600.00",
      prev_price_1h: "2640.00",
      volume_24h: "8500.0",
      turnover_24h: "22500000.00",
      open_interest: "8000000.00",
      open_interest_volume: "3018.86",
      funding_rate: "0.00008",
      next_funding_time: String(Date.now() + 3600000),
      best_ask_size: "3.0",
      best_ask_price: "2650.50",
      best_bid_size: "5.0",
      best_bid_price: "2649.50",
    },
    {
      symbol: "APTUSDC",
      last_price: "9.50",
      index_price: "9.49",
      mark_price: "9.50",
      prev_price_24h: "9.30",
      high_price_24h: "9.70",
      low_price_24h: "9.20",
      prev_price_1h: "9.45",
      volume_24h: "2500000.0",
      turnover_24h: "23500000.00",
      open_interest: "5000000.00",
      open_interest_volume: "526315.78",
      funding_rate: "0.00012",
      next_funding_time: String(Date.now() + 3600000),
      best_ask_size: "800.0",
      best_ask_price: "9.51",
      best_bid_size: "1000.0",
      best_bid_price: "9.49",
    },
  ],
};

const mockOrderbook = {
  result: {
    s: "BTCUSDC",
    ts: String(Date.now()),
    b: [
      ["43249.00", "0.5"],
      ["43248.00", "1.2"],
      ["43247.00", "2.0"],
      ["43246.00", "0.8"],
      ["43245.00", "1.5"],
    ] as [string, string][],
    a: [
      ["43251.00", "0.3"],
      ["43252.00", "0.9"],
      ["43253.00", "1.1"],
      ["43254.00", "0.6"],
      ["43255.00", "2.3"],
    ] as [string, string][],
    u: 123456,
    seq: 789012,
    mts: String(Date.now()),
  },
  time: new Date().toISOString(),
};

const mockKline = {
  symbol: "BTCUSDC",
  list: [
    {
      t: String(Date.now() - 60000),
      i: "1m" as const,
      o: "43100.00",
      h: "43300.00",
      l: "43050.00",
      c: "43250.00",
      T: String(Date.now()),
      v: "125.5",
      n: "1250",
    },
    {
      t: String(Date.now() - 120000),
      i: "1m" as const,
      o: "42900.00",
      h: "43150.00",
      l: "42850.00",
      c: "43100.00",
      T: String(Date.now() - 60000),
      v: "98.2",
      n: "980",
    },
  ],
};

const mockPriceKline = {
  symbol: "BTCUSDC",
  list: [
    {
      t: String(Date.now() - 60000),
      o: "43100.00",
      h: "43300.00",
      l: "43050.00",
      c: "43250.00",
    },
    {
      t: String(Date.now() - 120000),
      o: "42900.00",
      h: "43150.00",
      l: "42850.00",
      c: "43100.00",
    },
  ],
};

const mockFundingRateHistory = {
  list: [
    {
      symbol: "BTCUSDC",
      funding_rate: "0.0001",
      funding_time: new Date(Date.now() - 28800000).toISOString(),
    },
    {
      symbol: "BTCUSDC",
      funding_rate: "0.00008",
      funding_time: new Date(Date.now() - 57600000).toISOString(),
    },
  ],
};

const mockOpenInterest = {
  symbol: "BTCUSDC",
  list: [
    {
      open_interest: "15000000.00",
      timestamp: new Date().toISOString(),
    },
  ],
  next_page_cursor: "",
};

const mockLongShortRatio = {
  list: [
    {
      symbol: "BTCUSDC",
      buy_ratio: "0.55",
      sell_ratio: "0.45",
      timestamp: new Date().toISOString(),
    },
  ],
  next_page_cursor: "",
};

const mockPriceLimit = {
  symbol: "BTCUSDC",
  buy_limit: "50000.00",
  sell_limit: "35000.00",
  ts: new Date().toISOString(),
};

const mockRiskLimit = {
  list: [
    {
      symbol: "BTCUSDC",
      risk_id: 1,
      risk_limit_value: "2000000",
      maintenance_margin: "0.005",
      initial_margin: "0.01",
      is_lowest_risk: true,
      max_leverage: "100",
      mm_duration: "3600",
    },
  ],
  next_page_cursor: "",
};

const mockOrders = {
  list: [
    {
      order_id: "order-001",
      symbol: "BTCUSDC",
      user_id: "user-001",
      price: "42000.00",
      qty: "0.1",
      side: "Buy" as const,
      leverage: "10",
      margin_mode: "Cross" as const,
      order_status: "New" as const,
      avg_price: "0",
      leaves_qty: "0.1",
      leaves_value: "4200.00",
      cum_exec_qty: "0",
      cum_exec_value: "0",
      cum_exec_fee: "0",
      time_in_force: "GTC" as const,
      order_type: "Limit" as const,
      last_price_on_created: "43250.00",
      post_only: false,
      reduce_only: false,
      close_on_trigger: false,
      created_time: new Date(Date.now() - 3600000).toISOString(),
      updated_time: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      order_id: "order-002",
      symbol: "ETHUSDC",
      user_id: "user-001",
      price: "0",
      qty: "1.0",
      side: "Sell" as const,
      leverage: "5",
      margin_mode: "Cross" as const,
      order_status: "Filled" as const,
      avg_price: "2645.00",
      leaves_qty: "0",
      leaves_value: "0",
      cum_exec_qty: "1.0",
      cum_exec_value: "2645.00",
      cum_exec_fee: "1.32",
      time_in_force: "IOC" as const,
      order_type: "Market" as const,
      last_price_on_created: "2645.00",
      post_only: false,
      reduce_only: false,
      close_on_trigger: false,
      created_time: new Date(Date.now() - 7200000).toISOString(),
      updated_time: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  next_page_cursor: "",
};

const mockTradeHistory = {
  list: [
    {
      exec_id: "exec-001",
      symbol: "ETHUSDC",
      order_id: "order-002",
      side: "Sell" as const,
      user_id: "user-001",
      order_price: "0",
      order_qty: "1.0",
      leaves_qty: "0",
      order_type: "Market" as const,
      exec_price: "2645.00",
      exec_qty: "1.0",
      exec_value: "2645.00",
      exec_type: "Trade" as const,
      exec_time: new Date(Date.now() - 7200000).toISOString(),
      is_maker: false,
      fee_rate: "0.0005",
      mark_price: "2645.00",
      index_price: "2644.00",
      seq: 12345,
    },
    {
      exec_id: "exec-002",
      symbol: "BTCUSDC",
      order_id: "order-003",
      side: "Buy" as const,
      user_id: "user-001",
      order_price: "43100.00",
      order_qty: "0.05",
      leaves_qty: "0",
      order_type: "Limit" as const,
      exec_price: "43100.00",
      exec_qty: "0.05",
      exec_value: "2155.00",
      exec_type: "Trade" as const,
      exec_time: new Date(Date.now() - 86400000).toISOString(),
      is_maker: true,
      fee_rate: "0.0002",
      mark_price: "43100.00",
      index_price: "43098.00",
      seq: 12344,
    },
  ],
  next_page_cursor: "",
};

const mockPositions = {
  list: [
    {
      risk_id: 1,
      risk_limit_value: "2000000",
      symbol: "BTCUSDC",
      user_id: "user-001",
      side: "Buy" as const,
      size: "0.5",
      avg_price: "42500.00",
      position_value: "21625.00",
      margin_mode: "Cross" as const,
      position_balance: "2162.50",
      position_status: "Normal" as const,
      leverage: "10",
      mark_price: "43250.00",
      liq_price: "38500.00",
      bust_price: "38000.00",
      position_im: "2162.50",
      position_im_by_mp: "2162.50",
      position_mm: "108.12",
      position_mm_by_mp: "108.12",
      unrealized_pnl: "375.00",
      realized_pnl_cur: "0",
      realized_pnl_cum: "0",
      adl_rank_indicator: "One" as const,
      is_reduce_only: false,
      created_time: new Date(Date.now() - 86400000).toISOString(),
      updated_time: new Date().toISOString(),
      seq: 54321,
      take_profit: "45000.00",
      stop_loss: "40000.00",
    },
  ],
  next_page_cursor: "",
};

const mockClosedPnl = {
  list: [
    {
      symbol: "ETHUSDC",
      order_id: "order-003",
      side: "Sell" as const,
      qty: "2.0",
      order_price: "2650.00",
      order_type: "Limit" as const,
      exec_type: "Trade" as const,
      closed_size: "2.0",
      cum_entry_value: "5200.00",
      avg_entry_price: "2600.00",
      cum_exit_value: "5300.00",
      avg_exit_price: "2650.00",
      closed_pnl: "100.00",
      fill_count: "1",
      leverage: "10",
      open_fee: "2.60",
      close_fee: "2.65",
      created_time: new Date(Date.now() - 172800000).toISOString(),
      updated_time: new Date(Date.now() - 172800000).toISOString(),
    },
  ],
  next_page_cursor: "",
};

const mockRootAccount = {
  root_addr: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
};

const mockSubAccounts = {
  sub_accounts: [
    "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  ],
};

const mockLeaderboard = {
  data: [
    {
      place: "1",
      wallet: "0x3aF...89e1",
      account_value: "81450800.50",
      volume: "257450800.50",
      pnl: "8581693.00",
      roi: "109.89",
    },
    {
      place: "2",
      wallet: "0x9c2...b4D7",
      account_value: "80230150.75",
      volume: "161230150.75",
      pnl: "5374338.00",
      roi: "98.76",
    },
    {
      place: "3",
      wallet: "0xD1e...a66B",
      account_value: "74980400.00",
      volume: "115980400.00",
      pnl: "3866013.00",
      roi: "87.63",
    },
  ],
  meta: {
    total: 100,
  },
};

const mockUserLeverages = [
  {
    market_addr: "0xmarket_btc",
    leverage: 10,
    user_addr: "0x1234567890abcdef",
  },
  {
    market_addr: "0xmarket_eth",
    leverage: 20,
    user_addr: "0x1234567890abcdef",
  },
];

const mockDeposits = {
  list: [
    {
      deposit_id: "dep-001",
      tx_id: 12345,
      version: 1,
      root_addr: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      user_addr: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      from_addr: "0xfrom1234567890abcdef1234567890abcdef1234567890abcdef12345678",
      to_addr: "0xto1234567890abcdef1234567890abcdef1234567890abcdef123456789012",
      amount: "5000.00",
      last_updated: new Date(Date.now() - 604800000).toISOString(),
      created_at: new Date(Date.now() - 604800000).toISOString(),
      updated_at: new Date(Date.now() - 604800000).toISOString(),
    },
  ],
  next_page_cursor: "",
};

const mockWithdrawals = {
  list: [
    {
      withdraw_id: "wd-001",
      tx_id: 12346,
      version: 1,
      root_addr: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      user_addr: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      from_addr: "0xfrom1234567890abcdef1234567890abcdef1234567890abcdef12345678",
      to_addr: "0xto1234567890abcdef1234567890abcdef1234567890abcdef123456789012",
      amount: "1000.00",
      last_updated: new Date(Date.now() - 259200000).toISOString(),
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 259200000).toISOString(),
    },
  ],
  next_page_cursor: "",
};

const mockFundingRates = [
  {
    market_addr: "0xmarket_btc",
    funding_rate_percentage: 0.01,
    next_funding_time: new Date(Date.now() + 3600000).toISOString(),
    oracle_price: 43250.0,
    funding_index: 12345,
  },
  {
    market_addr: "0xmarket_eth",
    funding_rate_percentage: 0.008,
    next_funding_time: new Date(Date.now() + 3600000).toISOString(),
    oracle_price: 2650.0,
    funding_index: 6789,
  },
];

const mockLeaderboardAll = [
  {
    place: 1,
    wallet: "0x3aF...89e1",
    account_value: 81450800.5,
    volume: 257450800.5,
    pnl: 8581693,
    roi: 109.89,
  },
  {
    place: 2,
    wallet: "0x9c2...b4D7",
    account_value: 80230150.75,
    volume: 161230150.75,
    pnl: 5374338,
    roi: 98.76,
  },
];

const mockLeaderboardMy = {
  place: 4,
  wallet: "0x77b...C0f4",
  account_value: 67115330.2,
  volume: 67115330.2,
  pnl: 3070511,
  roi: 76.5,
};

const jsonResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

const corsResponse = () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

const getQueryParams = (url: URL) => {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
};

const routes: Record<string, (req: Request, url: URL) => Response | Promise<Response>> = {
  "GET /account/balance": () => jsonResponse(mockAccountBalance),

  "GET /market/tickers": (_req, url) => {
    const params = getQueryParams(url);
    if (params.symbol) {
      const ticker = mockTickers.list.find((t) => t.symbol === params.symbol);
      return jsonResponse({ list: ticker ? [ticker] : [] });
    }
    return jsonResponse(mockTickers);
  },
  "GET /market/orderbook": (_req, url) => {
    const params = getQueryParams(url);
    const result = { ...mockOrderbook };
    if (params.symbol) {
      result.result = { ...result.result, s: params.symbol };
    }
    return jsonResponse(result);
  },
  "GET /market/kline": (_req, url) => {
    const params = getQueryParams(url);
    return jsonResponse({ ...mockKline, symbol: params.symbol || mockKline.symbol });
  },
  "GET /market/mark-price-kline": (_req, url) => {
    const params = getQueryParams(url);
    return jsonResponse({ ...mockPriceKline, symbol: params.symbol || mockPriceKline.symbol });
  },
  "GET /market/index-price-kline": (_req, url) => {
    const params = getQueryParams(url);
    return jsonResponse({ ...mockPriceKline, symbol: params.symbol || mockPriceKline.symbol });
  },
  "GET /market/funding/history": () => jsonResponse(mockFundingRateHistory),
  "GET /market/open-interest": (_req, url) => {
    const params = getQueryParams(url);
    return jsonResponse({ ...mockOpenInterest, symbol: params.symbol || mockOpenInterest.symbol });
  },
  "GET /market/account-ratio": () => jsonResponse(mockLongShortRatio),
  "GET /market/price-limit": (_req, url) => {
    const params = getQueryParams(url);
    return jsonResponse({ ...mockPriceLimit, symbol: params.symbol || mockPriceLimit.symbol });
  },
  "GET /market/risk-limit": () => jsonResponse(mockRiskLimit),

  "POST /order/place": async (req) => {
    const body = (await req.json()) as PlaceOrderRequest;
    return jsonResponse({
      order_id: `order-${Date.now()}`,
      order_link_id: body.order_link_id || null,
    });
  },
  "POST /order/place-batch": async (req) => {
    const body = (await req.json()) as BatchPlaceOrdersRequest;
    const results = (body.request || []).map((order: PlaceOrderRequest, i: number) => ({
      order_id: `order-batch-${Date.now()}-${i}`,
      order_link_id: order.order_link_id || null,
    }));
    return jsonResponse({
      result: results,
      exit_info: results.map(() => ({ Success: { code: 0, msg: "ok" } })),
      time: new Date().toISOString(),
    });
  },
  "POST /order/amend": async (req) => {
    const body = (await req.json()) as AmendOrderRequest;
    return jsonResponse({
      order_id: body.order_id || `order-${Date.now()}`,
      order_link_id: body.order_link_id || null,
    });
  },
  "POST /order/amend-batch": async (req) => {
    const body = (await req.json()) as BatchAmendOrdersRequest;
    const results = (body.request || []).map((order: AmendOrderRequest) => ({
      order_id: order.order_id || `order-${Date.now()}`,
      order_link_id: order.order_link_id || null,
    }));
    return jsonResponse({
      result: results,
      exit_info: results.map(() => ({ Success: { code: 0, msg: "ok" } })),
      time: new Date().toISOString(),
    });
  },
  "POST /order/cancel": async (req) => {
    const body = (await req.json()) as CancelOrderRequest;
    return jsonResponse({
      order_id: body.order_id || "order-001",
      order_link_id: body.order_link_id || null,
    });
  },
  "POST /order/cancel-batch": async (req) => {
    const body = (await req.json()) as BatchCancelOrdersRequest;
    const results = (body.request || []).map((order: CancelOrderRequest) => ({
      order_id: order.order_id || `order-${Date.now()}`,
      order_link_id: order.order_link_id || null,
    }));
    return jsonResponse({
      result: results,
      exit_info: results.map(() => ({ Success: { code: 0, msg: "ok" } })),
      time: new Date().toISOString(),
    });
  },
  "POST /order/cancel-all": async () => {
    return jsonResponse({
      result: [
        { order_id: "order-001", order_link_id: null },
        { order_id: "order-002", order_link_id: null },
      ],
      exit_info: { Success: { code: 0, msg: "ok" } },
      time: new Date().toISOString(),
    });
  },
  "GET /order/realtime": () => jsonResponse(mockOrders),
  "GET /order/history": () => jsonResponse(mockOrders),
  "GET /execution/list": () => jsonResponse(mockTradeHistory),

  "GET /position/list": () => jsonResponse(mockPositions),
  "GET /position/closed-pnl": () => jsonResponse(mockClosedPnl),
  "POST /position/set-leverage": async () => {
    return jsonResponse({
      success: true,
      time: new Date().toISOString(),
    });
  },
  "POST /position/trading-stop": async () => {
    return jsonResponse({
      success: true,
      time: new Date().toISOString(),
    });
  },

  "POST /authorize": async () => {
    return jsonResponse({
      token: `mock-jwt-token-${Date.now()}`,
    });
  },
  "GET /user/root-account": () => jsonResponse(mockRootAccount),
  "GET /user/sub-accounts": () => jsonResponse(mockSubAccounts),
  "GET /user/leaderboard": () => jsonResponse(mockLeaderboard),
  "GET /user/leverages": () => jsonResponse(mockUserLeverages),

  "GET /asset/deposit/query-records": () => jsonResponse(mockDeposits),
  "GET /asset/withdraw/query-records": () => jsonResponse(mockWithdrawals),

  "POST /vault/withdraw-from-trading": async () => {
    return jsonResponse({ success: true });
  },

  "GET /funding/rates": () => jsonResponse(mockFundingRates),
  "GET /funding/rate": (_req, url) => {
    const params = getQueryParams(url);
    const rate = mockFundingRates.find((r) => r.market_addr === params.market_addr);
    return jsonResponse(rate || mockFundingRates[0]);
  },

  "GET /leaderboard/all": () => jsonResponse(mockLeaderboardAll),
  "GET /leaderboard/my": () => jsonResponse(mockLeaderboardMy),
};

Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    const pathname = url.pathname;

    if (method === "OPTIONS") {
      return corsResponse();
    }

    const routeKey = `${method} ${pathname}`;
    const handler = routes[routeKey];

    if (handler) {
      return handler(req, url);
    }

    return jsonResponse({ error: "Not Found", path: pathname }, 404);
  },
});
