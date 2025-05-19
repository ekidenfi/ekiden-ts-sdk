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

## Quick Start

```ts
import { EkidenClient, TESTNET } from "@ekiden/ts-sdk";

const ekiden = new EkidenClient(TESTNET);

// Authorize (get JWT)
const { token } = await ekiden.authorize({
  signature: "0x...",
  public_key: "0x..."
});
ekiden.setToken(token);

// Fetch markets
const markets = await ekiden.getMarkets();

// Fetch user orders
const orders = await ekiden.getUserOrders({ market_addr: "0x..." });

// Fetch user vaults
const vaults = await ekiden.getUserVaults();

// Fetch user positions
const positions = await ekiden.getUserPositions();
```

---

## Architecture

- **EkidenClient** — main entry point, aggregates REST, payload utilities, and Aptos helpers.
- **EkidenAPIClient** — low-level REST client with JWT support.
- **Types** — all types are centralized in `src/types.ts`.
- **Vault** — Aptos vault helpers (imported as `ekiden.vault`).

---

## Main Methods

- `authorize(params)` — user authorization, get JWT
- `setToken(token)` — set JWT for private methods
- `getMarkets()` — fetch markets
- `getOrders(params)` — fetch public orders
- `getFills(params)` — fetch public fills
- `getUserOrders(params)` — fetch user orders (JWT)
- `createOrder(params)` — create order (JWT)
- `getUserFills(params)` — fetch user fills (JWT)
- `getUserVaults(params)` — fetch user vaults (JWT)
- `getUserPositions(params)` — fetch user positions (JWT)
- `vault.*` — Aptos vault utilities (see `src/aptos/vault.ts`)

---

## Example: Create Order

```ts
const order = await ekiden.createOrder({
  market_addr: "0x...",
  side: "buy",
  size: 100,
  price: 123.45,
  type: "limit",
  nonce: 1,
  signature: "0x..."
});
```

---

## Example: Vault Usage

```ts
import { EkidenClient, TESTNET } from "@ekiden/ts-sdk";

const ekiden = new EkidenClient(TESTNET);

// Deposit to vault
const depositPayload = ekiden.vault.deposit({
  vaultAddress: "0x...",
  userAddress: "0x...",
  token: "0x...",
  amount: 1000n,
});

// Withdraw from vault
const withdrawPayload = ekiden.vault.withdraw({
  vaultAddress: "0x...",
  userAddress: "0x...",
  token: "0x...",
  amount: 500n,
});

// Get vault balance
const balanceOfPayload = ekiden.vault.balanceOf({
  vaultAddress: "0x...",
  userAddress: "0x...",
  token: "0x...",
});
```

---

## Documentation & Support

- [API Reference](https://github.com/ekidenfi/ekiden-ts-sdk)
- [Ekiden Gateway Docs](https://docs.ekiden.fi)
- Questions & issues: open a GitHub issue
