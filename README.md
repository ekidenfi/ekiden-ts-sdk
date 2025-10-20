# ekiden-ts-sdk

TypeScript SDK for interacting with the Ekiden Gateway and Aptos DeFi protocol.

---

## Installation

```sh
# pnpm
pnpm add @ekiden/ts-sdk

# npm
npm install @ekiden/ts-sdk

# yarn
yarn add @ekiden/ts-sdk

# bun
bun add @ekiden/ts-sdk
```


---

## Example: Basic flow (staging)

End-to-end example that authenticates with your Ed25519 private key, creates a limit order via intent, then cancels it, and (optionally) listens for private order updates over WebSocket.

- File: `example/basic.js`
- Network: Staging (host root: `https://api.staging.ekiden.fi`)

Prerequisites

- Provide one of the following as an environment variable (or in a `.env` file):
  - `PK=0x<root_owner_ed25519_private_key_hex>`
  - or `TRADING_PK=0x<trading_sub_ed25519_private_key_hex>`
- The example uses the trading sub-account for both authorization and intent signing. If only `PK` is provided, the script deterministically derives the trading sub-account using AIP-21-style message format.
- Important: Use the Ekiden web UI to create/restore your root account and trading sub-account, link accounts if prompted, and deposit funds into the appropriate vault for the asset you want to trade. The examples do not perform deposits or on-chain account setup.

Setup and run:

```sh
# from ts-sdk/
npm run build

# set env vars (or create a .env file)
export PK=0x<your_ed25519_private_key_hex>
# Alternatively, use a dedicated trading sub-account private key
# export TRADING_PK=0x<your_trading_ed25519_private_key_hex>
# Optional: provide a specific market or let the script fetch markets and pick one
# export MARKET_ADDR=0x<market_address_on_staging>
# Optional: select a market by symbol when MARKET_ADDR is not provided
# export SYMBOL=BTC-WUSDC
export SIDE=buy                 # buy | sell
export PRICE=50000000000        # integer scaled quote price
export SIZE=1000                # integer base size (scaled)
export LEVERAGE=1               # integer leverage
export IS_CROSS=true            # true=cross, false=isolated

node example/basic.js
```

What it does:

- Signs and calls `authorize` to receive a JWT
- Optionally connects to the private WS and subscribes to order events
- Builds and signs an `order_create` intent, sends it with commit
- Extracts the new order `sid` and sends a signed `order_cancel` intent
- Prints responses and any private order events

---

## Quick Start

```ts
import { Ed25519Account, Ed25519PrivateKey, PrivateKey } from "@aptos-labs/ts-sdk";
import { EkidenClient, TESTNET } from "@ekiden/ts-sdk";

// Initialize client for staging
const ekiden = new EkidenClient(TESTNET);

// Prepare an Aptos account
const formatted = PrivateKey.formatPrivateKey(process.env.PRIVATE_KEY!, "ed25519");
const privateKey = new Ed25519PrivateKey(formatted);
const account = new Ed25519Account({ privateKey });

// Authorize (get JWT) — sign AUTHORIZE|{timestamp_ms}|{nonce}
const timestamp_ms = Date.now();
const nonce = Math.random().toString(36).slice(2);
const message = `AUTHORIZE|${timestamp_ms}|${nonce}`;
const signature = account.sign(new TextEncoder().encode(message)).toString();

const { token } = await ekiden.httpApi.authorize({
  public_key: account.publicKey.toString(),
  timestamp_ms,
  nonce,
  signature,
});
await ekiden.setToken(token);

// Fetch user orders
const orders = await ekiden.httpApi.getUserOrders({ market_addr: "0x..." });

// Fetch user vaults
const vaults = await ekiden.httpApi.getUserVaults();

// Fetch user positions
const positions = await ekiden.httpApi.getUserPositions();
```

---

## Architecture

- **EkidenClient** — main entry point, aggregates REST, payload utilities, and Aptos helpers.
- **EkidenAPIClient** — low-level REST client with JWT support.
- **Types** — all types are centralized in `src/types.ts`.
- **Vault** — Aptos vault helpers (imported as `ekiden.vault`).

---

## Main Methods

- `httpApi.authorize(params)` — user authorization, get JWT
- `setToken(token)` — set JWT for private methods
- Public market data:
  - `httpApi.getMarkets()` — markets
  - `httpApi.getOrders(params)` — public orders
  - `httpApi.getFills(params)` — public fills
  - `httpApi.getCandles(params)` — OHLCV
  - `httpApi.getFundingRates(params)` / `httpApi.getFundingRateByMarket(market)`
- Private user data (JWT required):
  - `httpApi.getUserOrders(params)` — user orders
  - `httpApi.getUserFills(params)` — user fills
  - `httpApi.getUserVaults(params)` — user vaults
  - `httpApi.getUserPositions(params)` — user positions
  - `httpApi.getUserLeverage(market_addr)` / `httpApi.setUserLeverage(params)`
- Intents (JWT required):
  - `httpApi.sendIntent(params)` — send intent
  - `httpApi.sendIntentWithCommit(params)` — send intent and wait for commit
  - `buildOrderPayload({ payload, nonce })` — build bytes to sign for intents
 - Vault helpers: `vault.*` (see `src/aptos/vault.ts`)

---

## Example: Create Order Intent

```ts
import { buildOrderPayload } from "@ekiden/ts-sdk";

const payload = {
  type: "order_create",
  orders: [
    {
      market_addr: "0x...",
      side: "buy",
      size: 100,
      price: 123_450_000, // integer scaled price
      type: "limit",
      leverage: 1,
      is_cross: true,
      time_in_force: "PostOnly",
    },
  ],
};

const nonce = Date.now();
const toSign = buildOrderPayload({ payload, nonce });
const sig = account.sign(toSign).toString();

const resp = await ekiden.httpApi.sendIntentWithCommit({
  payload,
  nonce,
  signature: sig.startsWith("0x") ? sig : `0x${sig}`,
});
```

---

## Example: Vault Usage

For detailed examples of how to work with vault deposits and withdrawals, see the `example/` folder:

- **`example/deposit.js`** — complete example of depositing assets into a vault
- **`example/withdraw.js`** — complete example of withdrawing assets from a vault

Both examples show the full flow including:
- Setting up Aptos client and account
- Creating transaction payloads using `ekiden.vault` utilities
- Gas estimation and transaction submission
- Waiting for transaction confirmation

```ts
// Basic vault operations
const depositPayload = ekiden.vault.depositIntoUser({
  vaultAddress: "0x...",
  assetMetadata: "0x...",
  amount: BigInt(1000000)
});

const withdrawPayload = ekiden.vault.requestWithdrawFromUser({
  vaultAddress: "0x...",
  assetMetadata: "0x...",
  amount: BigInt(1000000)
});
```

---

## Base URLs and API versioning

- The SDK automatically prepends an API prefix (e.g., `/api/v1`) from the network config when building request URLs.
- TESTNET is pre-configured with `apiPrefix: "/api/v1"`, so set `baseURL` to the host root (e.g., `https://api.staging.ekiden.fi`), and the SDK will target versioned routes for you.
- WebSocket endpoints are separate: the client uses `wsURL` and `privateWSURL` to connect to `/ws/public` and `/ws/private`.



---

## Documentation & Support

- [API Reference](https://github.com/ekidenfi/ekiden-ts-sdk)
- [Ekiden Gateway Docs](https://docs.ekiden.fi)
- Questions & issues: open a GitHub issue
