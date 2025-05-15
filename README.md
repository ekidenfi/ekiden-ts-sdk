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
```

---

## Architecture

- **EkidenClient** — main entry point, aggregates REST, payload utilities, and Aptos helpers.
- **EkidenAPIClient** — low-level REST client with JWT support.
- **Types** — all types are centralized in `src/types.ts`.

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

## Documentation & Support

- [API Reference](https://github.com/ekidenfi/ekiden-ts-sdk)
- [Ekiden Gateway Docs](https://docs.ekiden.fi)
- Questions & issues: open a GitHub issue
