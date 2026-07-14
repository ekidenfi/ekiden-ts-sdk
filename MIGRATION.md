# Migration guide: Aptos → Canton

Starting with v3.0.0 the SDK no longer depends on `@aptos-labs/ts-sdk`. On-chain
operations moved from Aptos Move transactions to Canton (DAML) command batches.
This guide covers every breaking change and how to migrate.

## TL;DR

| Removed | Replacement |
|---|---|
| `export * from "@aptos-labs/ts-sdk"` | Built-in `Account`, `Ed25519PrivateKey`, `Serializer`, ... (drop-in for common cases) |
| `ekiden.vaultOnChain` (`VaultOnChainClient`) | `ekiden.canton` (`CantonCommands`) |
| `parseAbi` | Removed, no replacement (was Aptos-specific) |
| Aptos fullnode interaction (`aptos.view`, `transaction.build/sign/submit`) | Canton validator submission via `submitCantonCommands` |

Everything else — REST clients, WebSocket streams, auth, API keys,
`buildOrderPayload` (order signing payloads) — is unchanged.

## 1. Dependency and imports

`@aptos-labs/ts-sdk` is gone from dependencies, and the SDK no longer re-exports it.
The SDK now ships its own minimal Ed25519 + BCS implementation (backed by
`@noble/curves` / `@noble/hashes`) that is byte-compatible with the Aptos SDK for
everything Ekiden uses: address derivation, public keys, signatures, and BCS
serialization.

Before:

```typescript
import { Account, Ed25519PrivateKey, PrivateKey, PrivateKeyVariants } from "@ekidenfi/ts-sdk";
// (re-exported from @aptos-labs/ts-sdk)

const compliantPk = PrivateKey.formatPrivateKey(pk, PrivateKeyVariants.Ed25519);
const account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(compliantPk),
});
```

After:

```typescript
import { Account, Ed25519PrivateKey } from "@ekidenfi/ts-sdk";

// Accepts both "0x..." and "ed25519-priv-0x..." formats directly
const account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(pk),
});
```

Still available and behaviorally identical (same addresses, same signatures):

- `Account.fromPrivateKey({ privateKey })`, `Account.generate()`
- `account.accountAddress.toString()` — legacy Aptos address derivation is preserved,
  existing sub-account addresses do not change
- `account.publicKey.toString()`, `account.sign(bytes).toString()`
- `Serializer`, `U64`, `Bool`, `AccountAddress`

No longer available (import from `@aptos-labs/ts-sdk` yourself if you still need them):

- `Aptos`, `AptosConfig`, `Network`, `AptosSettings`
- `PrivateKey.formatPrivateKey` / `PrivateKeyVariants` — not needed; `Ed25519PrivateKey`
  normalizes key formats itself
- `parseTypeTag`, `MoveFunction`, ABI helpers (`parseAbi` was removed from the SDK too)
- The second `strict` argument of `new Ed25519PrivateKey(key, true)` — drop it

## 2. On-chain operations: `vaultOnChain` → `canton`

`VaultOnChainClient` built Move entry-function payloads for `aptos.transaction.build.simple`.
It is removed. `CantonCommands` builds Canton command batches instead:

| `ekiden.vaultOnChain.*` (removed) | `ekiden.canton.*` |
|---|---|
| `createEkidenUser` | `registerUser` |
| `createAndLinkSubAccount` | `createSubAccountWithVault` |
| `depositIntoFunding` | `depositIntoFunding` |
| `depositIntoFundingWithTransferTo` | `depositIntoFundingWithTransferRequest` |
| `transfer` / `transferRequest` | `createTransferRequest` |
| `requestFromTrading` | `createWithdrawalRequest` |
| `withdrawFromFunding` | `withdrawFromFunding` |
| `getSubAccs` / `ownedSubAccs` (view calls) | read from the gateway (`/account`, `/getContracts`) |
| `depositIntoInsurance` | removed (was unused) |

New in the Canton module:

- `createPreapproveTransfers` / `archivePreapproveTransfers`
- `acceptTransferOffer`
- `createBridgeUserAgreementRequest`
- Contract parsing helpers: `findHoldingsInContracts`, `findTransferOffersInContracts`,
  `findTransferPreapprovalInContracts`, `extractActiveContractCreatedEvent`, ...

### Key design difference

The old client took addresses and derived everything on-chain. The Canton builders are
**pure**: all ledger state (vault contract ids, holding UTXOs, transfer factories) must be
fetched by the caller — typically from the Ekiden gateway (`/account`, `/holdings`,
`/getContracts`) or a wallet — and passed in as parameters. The SDK never queries the
gateway for you.

### Configuration

Deployment-specific Canton settings are provided by the consumer via `config.canton`
(they used to live in app-level env vars):

```typescript
import { type CantonConfig, EkidenClient } from "@ekidenfi/ts-sdk";

const canton: CantonConfig = {
  packageId: "...",                       // Ekiden DAML package id
  userContractCid: "...",                 // User:User contract id
  userContractEventBlob: "...",           // its created-event blob (for disclosure)
  synchronizerId: "global-domain::...",
  adminPartyId: "...",                    // Ekiden platform admin party
  instrumentAdmin: "...",                 // e.g. USDCx interchain representative
  instrumentId: "USDCx",
  utilityRegistryBaseUrl: "https://...",  // token registrar API
  quoteAssetOperator: "...",
  transferPreapprovalTemplateId: "...",
  // optional: transferOfferTemplateId, transferInstructionInterfaceTemplateId, bridge
};

const ekiden = new EkidenClient({ ...restConfig, canton });
// enables ekiden.canton and ekiden.cantonRegistry
```

### Example: deposit flow

Before (Aptos):

```typescript
const payload = ekiden.vaultOnChain.depositIntoFunding({
  subAddress: funding.address,
  amount: 250_000_000n,
});

const tx = await aptos.transaction.build.simple({ sender, data: payload });
const auth = aptos.transaction.sign({ signer: account, transaction: tx });
const committed = await aptos.transaction.submit.simple({ transaction: tx, senderAuthenticator: auth });
await aptos.waitForTransaction({ transactionHash: committed.hash });
```

After (Canton):

```typescript
import { submitCantonCommands } from "@ekidenfi/ts-sdk";

// 1. Caller fetches ledger state (gateway, console wallet, etc.)
const account = await fetch(`${gatewayUrl}/account?partyId=${partyId}`).then((r) => r.json());
const holdings = await fetch(`${gatewayUrl}/holdings?partyId=${partyId}`).then((r) => r.json());

// 2. Resolve a transfer factory from the token registrar
const factory = await ekiden.cantonRegistry.fetchTransferFactory({
  sender: partyId,
  receiver: canton.adminPartyId,
  amount: "250.0",
  inputHoldingCids: holdings.map((h) => h.contractId),
});

// 3. Build the command batch (pure, no network)
const batch = ekiden.canton.depositIntoFunding({
  partyId,
  amount: "250.0",
  fundingVaultCid: account.fundingVaults.at(-1).contractId,
  holdingCids: holdings.map((h) => h.contractId),
  transferFactory: factory,
});

// 4. Submit to a Canton validator (caller provides URL + OIDC access token)
await submitCantonCommands({ url: validatorUrl, accessToken, batch });
```

### Example: registration

Before: `vaultOnChain.createEkidenUser({ vaultAddress })` + Aptos tx pipeline.

After:

```typescript
const batch = ekiden.canton.registerUser({ partyId });
await submitCantonCommands({ url: validatorUrl, accessToken, batch });
```

### Example: withdrawal from trading

Before: `vaultOnChain.requestFromTrading(...)` with on-chain nonce lookup via `aptos.view`.

After:

```typescript
const batch = ekiden.canton.createWithdrawalRequest({
  partyId,
  requestedAmount: "100.0",
  fundingVaultCid,  // from gateway /account
  tradingVaultCid,  // from gateway /account
});
await submitCantonCommands({ url: validatorUrl, accessToken, batch });
```

## 3. Unchanged

- `buildOrderPayload` — order/cancel/leverage signing payloads produce byte-identical
  output (BCS encoding preserved)
- Sub-account derivation: `createSubAccountDeterministic`, `createSubAccountsDeterministic`,
  `createAccountMessage`, `buildLinkProof` — same addresses as before
- Auth: `user.authorize`, `user.authorizeWithAccount`, API key flows, private WS auth
- All REST clients (`account`, `market`, `trade`, `position`, `vault`, ...) and
  WebSocket streams

## 4. Checklist

- [ ] Bump to v3.x
- [ ] Remove direct `@aptos-labs/ts-sdk` usage; if you still need the Aptos client,
      depend on it explicitly in your own app
- [ ] Replace `PrivateKey.formatPrivateKey(...)` with plain `new Ed25519PrivateKey(pk)`
- [ ] Drop the second argument of `new Ed25519PrivateKey(key, true)`
- [ ] Replace `ekiden.vaultOnChain.*` calls per the table above
- [ ] Provide `config.canton` (values that previously came from app env vars)
- [ ] Fetch vault/holding contract ids from the gateway and pass them into the builders
- [ ] Replace the Aptos tx pipeline (`build`/`sign`/`submit`/`waitForTransaction`) with
      `submitCantonCommands` against your validator
