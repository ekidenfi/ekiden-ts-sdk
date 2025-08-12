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
import { Ed25519Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

import { EkidenClient, TESTNET } from "@ekiden/ts-sdk";

const ekiden = new EkidenClient(TESTNET);

const privateKey = new Ed25519PrivateKey(ENV.PRIVATE_KEY);
const account = new Ed25519Account({ privateKey });

const publicKey = account.publicKey.toString();

const messageBytes = new TextEncoder().encode("AUTHORIZE");
const signature = account.sign(messageBytes).toString();


// Authorize (get JWT)
const { token } = await ekiden.authorize({
  signature: signature,
  public_key: publicKey
});

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

## Documentation & Support

- [API Reference](https://github.com/ekidenfi/ekiden-ts-sdk)
- [Ekiden Gateway Docs](https://docs.ekiden.fi)
- Questions & issues: open a GitHub issue
