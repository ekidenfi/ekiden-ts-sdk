// Basic example:
// 1. Authenticate (with either prod/staging/local);
// 2. Listen to the private WS order;
// 3. Place a limit order;
// 4. Receive order updates (create);
// 5. Cancel the order;
// 6. Receive order updates (cancel);
// 7. Exit.
//
// Required env: PK=<private_key>
// Optional env: NETWORK=prod/staging/local (default: staging)
//
// Note: Root owner PK (private key) is required.
// Supported private key formats:
// - ed25519-priv-0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1
// - 0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1
//
// Example:
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 bun run example/basic.ts`
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 NETWORK=local bun run example/basic.ts`

async function main() {}

// Only run main if this file is executed directly
if (import.meta.main) {
	await main();
	process.exit(0);
}
