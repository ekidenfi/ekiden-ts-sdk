# Ekiden TypeScript SDK

Professional TypeScript SDK for interacting with Ekiden Gateway and Aptos DeFi protocol.

## Installation

```bash
npm install @ekidenfi/ts-sdk
pnpm add @ekidenfi/ts-sdk
yarn add @ekidenfi/ts-sdk
bun add @ekidenfi/ts-sdk
```

## Architecture

The SDK follows a modular, object-oriented architecture with clear separation of concerns:

```
EkidenClient
├── account         - Account balance, funding, withdrawals
├── asset           - Deposit/withdrawal records
├── market          - Market data, orderbook, klines, tickers
├── trade           - Order management (place, amend, cancel)
├── position        - Position management, leverage, TP/SL
├── funding         - Funding rates
├── leaderboard     - Leaderboard data
├── user            - User authentication
├── vault           - Vault operations (REST API)
├── vaultOnChain    - Aptos on-chain vault operations
├── system          - System information
├── publicStream    - Public WebSocket streams
└── privateStream   - Private WebSocket streams
```

### Core Principles

- **Modular Design**: Each domain has its own client (MarketClient, TradeClient, etc.)
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **OOP Approach**: Proper object-oriented design with class instances
- **Clean Separation**: Business logic separated by domain

## Quick Start

```typescript
import { EkidenClient, TESTNET } from "@ekidenfi/ts-sdk";
import { Ed25519Account, Ed25519PrivateKey, PrivateKey } from "@aptos-labs/ts-sdk";

const ekiden = new EkidenClient(TESTNET);

// Setup account
const formatted = PrivateKey.formatPrivateKey(process.env.PRIVATE_KEY!, "ed25519");
const privateKey = new Ed25519PrivateKey(formatted);
const account = new Ed25519Account({ privateKey });

// Authenticate
const timestamp_ms = Date.now();
const nonce = Math.random().toString(36).slice(2);
const message = `AUTHORIZE|${timestamp_ms}|${nonce}`;
const signature = account.sign(new TextEncoder().encode(message)).toString();

const { token } = await ekiden.user.authorize({
  public_key: account.publicKey.toString(),
  timestamp_ms,
  nonce,
  signature,
});

ekiden.setToken(token);

// Use the SDK
const markets = await ekiden.market.getMarkets();
const balance = await ekiden.account.getBalance();
const positions = await ekiden.position.getPositionInfo({ symbol: "BTCUSDT" });
```

## Module Documentation

### MarketClient

Access market data, orderbook, klines, and statistics.

```typescript
// Get all tickers
const tickers = await ekiden.market.getTickers();

// Get specific market ticker
const btcTicker = await ekiden.market.getTickers({ symbol: "BTCUSDT" });

// Get markets (wrapper over getTickers)
const markets = await ekiden.market.getMarkets();

// Get orderbook
const orderbook = await ekiden.market.getOrderbook({
  symbol: "BTCUSDT",
  limit: 50,
});

// Get klines (OHLCV candles)
const klines = await ekiden.market.getKline({
  symbol: "BTCUSDT",
  interval: "1h",
  limit: 100,
});

// Get mark price klines
const markPriceKlines = await ekiden.market.getMarkPriceKline({
  symbol: "BTCUSDT",
  interval: "1h",
});

// Get index price klines
const indexPriceKlines = await ekiden.market.getIndexPriceKline({
  symbol: "BTCUSDT",
  interval: "1h",
});

// Get funding rate history
const fundingHistory = await ekiden.market.getFundingRateHistory({
  symbol: "BTCUSDT",
  limit: 100,
});

// Get open interest
const openInterest = await ekiden.market.getOpenInterest({
  symbol: "BTCUSDT",
  interval: "5min",
});

// Get long/short ratio
const ratio = await ekiden.market.getLongShortRatio({
  symbol: "BTCUSDT",
  period: "5min",
});

// Get order price limits
const priceLimit = await ekiden.market.getOrderPriceLimit("BTCUSDT");

// Get risk limits
const riskLimits = await ekiden.market.getRiskLimit({ symbol: "BTCUSDT" });

// Get recent trades
const recentTrades = await ekiden.market.getRecentTrades({
  category: "linear",
  symbol: "BTCUSDT",
});

// Get 24h market statistics
const stats = await ekiden.market.getMarketStats("BTCUSDT");
```

### TradeClient

Manage orders - place, amend, cancel.

```typescript
// Place a limit order
const order = await ekiden.trade.placeOrder({
  symbol: "BTCUSDT",
  side: "Buy",
  order_type: "Limit",
  qty: "0.001",
  price: "50000",
  leverage: "10",
  margin_mode: "Cross",
  time_in_force: "GTC",
  post_only: false,
  reduce_only: false,
  close_on_trigger: false,
});

// Place a market order
const marketOrder = await ekiden.trade.placeOrder({
  symbol: "BTCUSDT",
  side: "Buy",
  order_type: "Market",
  qty: "0.001",
  price: "0",
  leverage: "10",
  margin_mode: "Cross",
  time_in_force: "IOC",
  post_only: false,
  reduce_only: false,
  close_on_trigger: false,
});

// Place order with TP/SL
const orderWithTpSl = await ekiden.trade.placeOrder({
  symbol: "BTCUSDT",
  side: "Buy",
  order_type: "Limit",
  qty: "0.001",
  price: "50000",
  leverage: "10",
  margin_mode: "Cross",
  time_in_force: "GTC",
  post_only: false,
  reduce_only: false,
  close_on_trigger: false,
  tpsl: {
    mode: "Full",
    take_profit: {
      market: {
        trigger_price: "55000",
        trigger_by: "LastPrice",
      },
    },
    stop_loss: {
      market: {
        trigger_price: "48000",
        trigger_by: "LastPrice",
      },
    },
  },
});

// Batch place orders
const batchOrders = await ekiden.trade.batchPlaceOrders({
  request: [
    {
      symbol: "BTCUSDT",
      side: "Buy",
      order_type: "Limit",
      qty: "0.001",
      price: "49000",
      leverage: "10",
      margin_mode: "Cross",
      time_in_force: "GTC",
      post_only: false,
      reduce_only: false,
      close_on_trigger: false,
    },
    {
      symbol: "BTCUSDT",
      side: "Buy",
      order_type: "Limit",
      qty: "0.001",
      price: "48000",
      leverage: "10",
      margin_mode: "Cross",
      time_in_force: "GTC",
      post_only: false,
      reduce_only: false,
      close_on_trigger: false,
    },
  ],
});

// Amend order
const amended = await ekiden.trade.amendOrder({
  symbol: "BTCUSDT",
  order_id: "order-id-here",
  size: 0.002,
  price: 51000,
});

// Cancel order
const cancelled = await ekiden.trade.cancelOrder({
  symbol: "BTCUSDT",
  order_id: "order-id-here",
});

// Cancel all orders
const cancelledAll = await ekiden.trade.cancelAllOrders({
  symbol: "BTCUSDT",
});

// Get active orders
const activeOrders = await ekiden.trade.getRealtimeOrders({
  symbol: "BTCUSDT",
  open_only: true,
});

// Get order history
const orderHistory = await ekiden.trade.getOrderHistory({
  symbol: "BTCUSDT",
  limit: 50,
});

// Get trade/execution history
const tradeHistory = await ekiden.trade.getTradeHistory({
  symbol: "BTCUSDT",
  limit: 50,
});
```

### PositionClient

Position management and queries.

```typescript
// Get positions
const positions = await ekiden.position.getPositionInfo({
  symbol: "BTCUSDT",
});

// Get closed PnL history
const closedPnl = await ekiden.position.getClosedPnl({
  symbol: "BTCUSDT",
  limit: 50,
});

// Set leverage
await ekiden.position.setLeverage({
  symbol: "BTCUSDT",
  leverage: "20",
});

// Set trading stop (TP/SL)
await ekiden.position.setTradingStop({
  symbol: "BTCUSDT",
  tpsl: {
    mode: "Full",
    take_profit: {
      market: {
        trigger_price: "55000",
        trigger_by: "LastPrice",
      },
    },
    stop_loss: {
      market: {
        trigger_price: "48000",
        trigger_by: "LastPrice",
      },
    },
  },
});
```

### AccountClient

Account balance and fund management.

```typescript
// Get account balance
const balance = await ekiden.account.getBalance();

// Fund account (faucet - testnet only)
const funded = await ekiden.account.fund({
  receiver: "0x...",
  metadatas: ["0x..."],
  amounts: [1000000],
});

// Withdraw from account
const withdrawn = await ekiden.account.withdraw({
  asset: "USDT",
  amount: "100",
});
```

### AssetClient

Deposit and withdrawal records.

```typescript
// Get deposit records
const deposits = await ekiden.asset.getDeposits({
  limit: 50,
});

// Get withdrawal records
const withdrawals = await ekiden.asset.getWithdrawals({
  limit: 50,
});
```

### FundingClient

Funding rates.

```typescript
// Get funding rate by market
const fundingRate = await ekiden.funding.getFundingRateByMarket("0x...");
```

### LeaderboardClient

Leaderboard data and rankings.

```typescript
// Get global leaderboard
const leaderboard = await ekiden.leaderboard.getLeaderboardAll({
  time_frame: "24h",
  page: 1,
  per_page: 50,
});

// Get my leaderboard position
const myRank = await ekiden.leaderboard.getLeaderboardMy({
  time_frame: "24h",
});
```

### UserClient

User authentication and account info.

```typescript
// Authenticate
const { token, user_id } = await ekiden.user.authorize({
  public_key: "0x...",
  timestamp_ms: Date.now(),
  nonce: "random-nonce",
  signature: "0x...",
});

// Get root account
const rootAccount = await ekiden.user.getRootAccount();

// Get sub accounts
const subAccounts = await ekiden.user.getSubAccounts();
```

### VaultClient

Vault operations via REST API.

```typescript
// Deposit into vault
await ekiden.vault.deposit(params);

// Withdraw from vault
await ekiden.vault.withdraw(params);
```

### VaultOnChainClient

Aptos on-chain vault operations.

```typescript
// Deposit into user account
const depositPayload = ekiden.vaultOnChain.depositIntoUser({
  vaultAddress: "0x...",
  assetMetadata: "0x...",
  amount: BigInt(1000000),
});

// Request withdrawal
const withdrawPayload = ekiden.vaultOnChain.requestWithdrawFromUser({
  vaultAddress: "0x...",
  assetMetadata: "0x...",
  amount: BigInt(1000000),
});

// Get vault balance
const balance = ekiden.vaultOnChain.vaultBalance({
  vaultAddress: "0x...",
  userAddress: "0x...",
  assetMetadata: "0x...",
  vaultType: "Cross",
});

// Create Ekiden user
const createUserPayload = ekiden.vaultOnChain.createEkidenUser({
  vaultAddress: "0x...",
  fundingLinkProof: fundingLinkProof,
  crossTradingLinkProof: tradingLinkProof,
});
```

### SystemClient

System information.

```typescript
// Get system info
const systemInfo = await ekiden.system.getSystemInfo();
// Returns: { aptos_network, perpetual_addr, vault_contract_address, ... }
```

### PublicStream

Public WebSocket streams for market data.

```typescript
if (ekiden.publicStream) {
  ekiden.publicStream.subscribeHandlers({
    "orderbook/BTCUSDT": (event) => {
      console.log("Orderbook update:", event.data);
    },
    "trade/BTCUSDT": (event) => {
      console.log("Trade:", event.data);
    },
    "ticker/BTCUSDT": (event) => {
      console.log("Ticker:", event.data);
    },
  });
}
```

### PrivateStream

Private WebSocket streams for user events.

```typescript
if (ekiden.privateStream) {
  await ekiden.privateStream.connect();

  ekiden.privateStream.subscribe(["orders", "positions", "executions"], (data) => {
    console.log("User event:", data);
  });

  ekiden.privateStream.subscribe({
    orders: (data) => console.log("Order update:", data),
    positions: (data) => console.log("Position update:", data),
  });
}
```

## Utility Functions

### Account Creation Utilities

Functions for creating and managing sub-accounts (Funding and Trading).

```typescript
import {
  createAccountMessage,
  createSubAccountFromSignature,
  createSubAccountDeterministic,
  createSubAccounts,
  createSubAccountsDeterministic,
  buildLinkProof,
} from "@ekidenfi/ts-sdk";

// 1. Create message for wallet signing
const fundingMessage = createAccountMessage(rootAddress, "Funding");
const tradingMessage = createAccountMessage(rootAddress, "Trading");

// 2a. For standard wallets - create from signature
const fundingSignature = await wallet.signMessage(fundingMessage);
const tradingSignature = await wallet.signMessage(tradingMessage);

const fundingAccount = createSubAccountFromSignature({
  rootAddress,
  type: "Funding",
  signature: fundingSignature.signature,
});

const tradingAccount = createSubAccountFromSignature({
  rootAddress,
  type: "Trading",
  signature: tradingSignature.signature,
});

// Or create both at once
const { funding, trading } = createSubAccounts(
  rootAddress,
  fundingSignature.signature,
  tradingSignature.signature
);

// 2b. For keyless wallets (Google, Apple) - create deterministically
const fundingAccount = await createSubAccountDeterministic({
  rootAddress,
  type: "Funding",
});

// Or create both at once
const { funding, trading } = await createSubAccountsDeterministic(rootAddress);

// 3. Build link proof for blockchain registration
const linkProof = buildLinkProof(
  account.publicKey.toUint8Array(),
  rootAddress,
  account.sign(rootAddress).toUint8Array()
);

// 4. Register on blockchain
const payload = ekiden.vaultOnChain.createEkidenUser({
  vaultAddress: VAULT_ADDRESS,
  fundingLinkProof: fundingLinkProof,
  crossTradingLinkProof: tradingLinkProof,
});
```

### BN (BigNumber)

Enhanced BigNumber class for precise calculations.

```typescript
import { BN } from "@ekidenfi/ts-sdk";

const amount = new BN("1.5");
const scaled = BN.parseUnits(amount, 8);
const formatted = BN.formatUnits(scaled, 8);
```

### addressToBytes

Convert addresses to byte arrays.

```typescript
import { addressToBytes } from "@ekidenfi/ts-sdk";

const bytes = addressToBytes("0x1234...");
```

## Configuration

```typescript
import { EkidenClientConfig, TESTNET } from "@ekidenfi/ts-sdk";

// Use predefined testnet config
const ekiden = new EkidenClient(TESTNET);

// Custom configuration
const CUSTOM: EkidenClientConfig = {
  baseURL: "https://your-api.example.com",
  wsURL: "wss://your-api.example.com/ws/public",
  privateWSURL: "wss://your-api.example.com/ws/private",
  apiPrefix: "/api/v1",
};

const customClient = new EkidenClient(CUSTOM);
```

## Token Management

```typescript
// Set token for REST API
ekiden.setToken(token);

// Set tokens for both REST and WebSocket
await ekiden.setTokens({
  rest: restToken,
  ws: wsToken,
  connectPrivateWS: true,
});
```

## Helper Methods for Private Streams

```typescript
ekiden.subscribeTo(["orders", "positions"], handler);
ekiden.unsubscribeFrom(["orders"], handler);

ekiden.subscribeHandlers({
  orders: orderHandler,
  positions: positionHandler,
});
ekiden.unsubscribeHandlers({ orders: orderHandler });
```

## Type Exports

All types are exported for external use:

```typescript
import type {
  // Order types
  Order,
  OrderId,
  OrderLinkId,
  OrderStatus,
  OrderType,
  PlaceOrderRequest,
  PlaceOrderResponse,
  AmendOrderRequest,
  CancelOrderRequest,

  // Position types
  Position,
  PositionStatus,
  GetPositionInfoParams,
  SetLeverageRequest,
  SetTradingStopRequest,

  // Market types
  TickerSnapshot,
  KlineSnapshot,
  OrderBookSnapshot,
  GetTickersParams,
  GetKlineParams,
  GetOrderBookParams,

  // Account types
  AccountBalance,
  GetAccountBalanceResponse,

  // Common types
  Side,
  MarginMode,
  TimeInForce,
  Interval,
  TpSl,
  TpSlMode,
  ConditionalOrder,
  TriggerBy,
} from "@ekidenfi/ts-sdk";
```

## Error Handling

```typescript
try {
  const orders = await ekiden.trade.getRealtimeOrders({ open_only: true });
} catch (error) {
  if (error.message.includes("Not authenticated")) {
    console.error("Please authenticate first");
  }
  console.error("Error:", error);
}
```

## Links

- [Ekiden Documentation](https://docs.ekiden.fi)

## License

ISC
