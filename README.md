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
├── market          - Market data, candles, statistics
├── order           - Order management, fills, intents
├── user            - User authentication, portfolio, leverage
├── position        - Position management
├── vault           - Vault operations (REST API)
├── vaultOnChain    - Aptos on-chain vault operations
├── funding         - Funding rates and epochs
├── leaderboard     - Leaderboard data
├── publicStream    - Public WebSocket streams
└── privateStream   - Private WebSocket streams
```

### Core Principles

- **Modular Design**: Each domain has its own client (MarketClient, OrderClient, etc.)
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **OOP Approach**: Proper object-oriented design with class instances
- **Clean Separation**: Business logic separated by domain

## Quick Start

```typescript
import { EkidenClient, TESTNET } from "@ekidenfi/ts-sdk";
import { Ed25519Account, Ed25519PrivateKey, PrivateKey } from "@aptos-labs/ts-sdk";

const ekiden = new EkidenClient(TESTNET);

const formatted = PrivateKey.formatPrivateKey(process.env.PRIVATE_KEY!, "ed25519");
const privateKey = new Ed25519PrivateKey(formatted);
const account = new Ed25519Account({ privateKey });

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

await ekiden.setToken(token);

const markets = await ekiden.market.getMarkets();
const portfolio = await ekiden.user.getUserPortfolio();
const positions = await ekiden.position.getUserPositions();
```

## Module Documentation

### MarketClient

Access market data, OHLCV candles, and statistics.

```typescript
const markets = await ekiden.market.getMarkets();

const marketInfo = await ekiden.market.getMarketInfo({
  symbol: "BTC-WUSDC",
});

const candles = await ekiden.market.getCandles({
  market_addr: "0x...",
  timeframe: "1h",
  start_time: Date.now() - 86400000,
});

const stats = await ekiden.market.getMarketStats("0x...");
```

### OrderClient

Manage orders, fills, and intents.

```typescript
const orders = await ekiden.order.getOrders({
  market_addr: "0x...",
  page: 1,
  per_page: 50,
});

const userOrders = await ekiden.order.getUserOrders({
  market_addr: "0x...",
});

const fills = await ekiden.order.getUserFills();

import { buildOrderPayload } from "@ekidenfi/ts-sdk";

const payload = {
  type: "order_create",
  orders: [{
    market_addr: "0x...",
    side: "buy",
    size: 100,
    price: 50000000000,
    type: "limit",
    leverage: 1,
    is_cross: true,
    time_in_force: "PostOnly",
  }],
};

const nonce = Date.now();
const toSign = buildOrderPayload({ payload, nonce });
const sig = account.sign(toSign).toString();

const response = await ekiden.order.sendIntentWithCommit({
  payload,
  nonce,
  signature: sig.startsWith("0x") ? sig : `0x${sig}`,
});
```

### UserClient

User authentication, portfolio, and leverage management.

```typescript
const portfolio = await ekiden.user.getUserPortfolio();

const leverage = await ekiden.user.getUserLeverage("0x...");

await ekiden.user.setUserLeverage({
  market_addr: "0x...",
  leverage: 5,
});

const allPortfolios = await ekiden.user.getAllPortfolios();
```

### PositionClient

Position management and queries.

```typescript
const positions = await ekiden.position.getUserPositions();

const marketPositions = await ekiden.position.getUserPositions({
  market_addr: "0x...",
});
```

### VaultClient

Vault operations via REST API.

```typescript
const vaults = await ekiden.vault.getUserVaults();

await ekiden.vault.withdrawFromTrading({
  addr_from: "0x...",
  addr_to: "0x...",
  amount: 1000000,
  asset_metadata: "0x...",
  nonce: Date.now(),
  signature: "0x...",
  timestamp: Date.now(),
  withdraw_available: true,
});
```

### VaultOnChain

Aptos on-chain vault operations.

```typescript
const depositPayload = ekiden.vaultOnChain.depositIntoUser({
  vaultAddress: "0x...",
  assetMetadata: "0x...",
  amount: BigInt(1000000),
});

const withdrawPayload = ekiden.vaultOnChain.requestWithdrawFromUser({
  vaultAddress: "0x...",
  assetMetadata: "0x...",
  amount: BigInt(1000000),
});

const balance = ekiden.vaultOnChain.vaultBalance({
  vaultAddress: "0x...",
  userAddress: "0x...",
  assetMetadata: "0x...",
  vaultType: "Cross",
});
```

### FundingClient

Funding rates and epochs.

```typescript
const fundingRates = await ekiden.funding.getFundingRates();

const fundingRate = await ekiden.funding.getFundingRateByMarket("0x...");

const epoch = await ekiden.funding.getFundingEpoch();
```

### LeaderboardClient

Leaderboard data and rankings.

```typescript
const leaderboard = await ekiden.leaderboard.getLeaderboardAll({
  time_frame: "24h",
  page: 1,
  per_page: 50,
});

const myRank = await ekiden.leaderboard.getLeaderboardMy({
  time_frame: "24h",
});
```

### PublicStream

Public WebSocket streams for market data.

```typescript
if (ekiden.publicStream) {
  ekiden.publicStream.subscribeHandlers({
    "orderbook/0x...": (event) => {
      console.log("Orderbook update:", event.data);
    },
    "trade/0x...": (event) => {
      console.log("Trade:", event.data);
    },
    "ticker/0x...": (event) => {
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

  ekiden.privateStream.subscribe(["orders", "positions", "fills"], (data) => {
    console.log("User event:", data);
  });

  ekiden.privateStream.subscribe({
    "orders": (data) => console.log("Order update:", data),
    "positions": (data) => console.log("Position update:", data),
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
  tradingSignature.signature,
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
  account.sign(rootAddress).toUint8Array(),
);

// 4. Register on blockchain
const payload = ekiden.vaultOnChain.createEkidenUser({
  vaultAddress: VAULT_ADDRESS,
  fundingLinkProof: fundingLinkProof,
  crossTradingLinkProof: tradingLinkProof,
});
```

#### SubAccount Type

```typescript
interface SubAccount {
  address: string;
  privateKey: string;
  publicKey: string;
  type: "funding" | "trading";
  nonce: string;
}
```

### buildOrderPayload

Build payload for order intents.

```typescript
import { buildOrderPayload } from "@ekidenfi/ts-sdk";

const hexPayload = buildOrderPayload({
  payload: {
    type: "order_create",
    orders: [...],
  },
  nonce: Date.now(),
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

const TESTNET: EkidenClientConfig = {
  baseURL: "https://api.staging.ekiden.fi",
  wsURL: "wss://api.staging.ekiden.fi/ws/public",
  privateWSURL: "wss://api.staging.ekiden.fi/ws/private",
  apiPrefix: "/api/v1",
};

const ekiden = new EkidenClient(TESTNET);

const CUSTOM: EkidenClientConfig = {
  baseURL: "https://your-api.example.com",
  apiPrefix: "/api/v2",
};

const customClient = new EkidenClient(CUSTOM);
```

## Advanced Usage

### Token Management

```typescript
await ekiden.setToken(token);

await ekiden.setTokens({
  rest: restToken,
  ws: wsToken,
  connectPrivateWS: true,
});
```

### Helper Methods for Private Streams

```typescript
ekiden.subscribeTo(["orders", "positions"], handler);
ekiden.unsubscribeFrom(["orders"], handler);

ekiden.subscribeHandlers({
  "orders": orderHandler,
  "positions": positionHandler,
});
ekiden.unsubscribeHandlers({ "orders": orderHandler });
```

## Backward Compatibility

The SDK maintains backward compatibility with the previous API:

```typescript
import { Vault } from "@ekidenfi/ts-sdk";

const payload = Vault.depositIntoUser({
  vaultAddress: "0x...",
  assetMetadata: "0x...",
  amount: BigInt(1000000),
});
```

## Type Exports

All types are exported for external use:

```typescript
import type {
  MarketResponse,
  OrderResponse,
  PositionResponse,
  FillResponse,
  VaultResponse,
  ActionPayload,
  SendIntentParams,
  PaginationParams,
} from "@ekidenfi/ts-sdk";
```

## Error Handling

```typescript
try {
  const orders = await ekiden.order.getUserOrders();
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
