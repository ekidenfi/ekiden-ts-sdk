// Basic example:
// 1. Authenticate (with either prod/staging/local);
// 2. Fetch tickers via REST API;
// 3. Listen to the public WS orderbook.10.BTC-USDC;
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

import { Account, type Ed25519Account, Ed25519PrivateKey, EkidenClient } from "../src";

/**
 * Common configuration for the SDK examples.
 */
export const SDK_CONFIG = {
	baseURL: Bun.env.BASE_URL || "http://localhost:4020",
	wsURL: Bun.env.WS_URL || "ws://localhost:4020/ws/public",
	apiPrefix: "/api/v1",
	contractAddress: "0x1", // Placeholder for local dev
};

/**
 * Authenticates with the Ekiden backend and returns a JWT token.
 * Reusable across different example scripts.
 *
 * @param pk - Ed25519 private key hex
 * @returns JWT token string
 */
export async function auth(pk: string, client = new EkidenClient(SDK_CONFIG)): Promise<[string, Ed25519Account]> {
	const account = Account.fromPrivateKey({
		privateKey: new Ed25519PrivateKey(pk),
	});
	try {
		const response = await client.user.authorizeWithAccount(account);
		return [response.token, account];
	} catch (error) {
		throw new Error(`Authentication failed: ${error instanceof Error ? error.message : error}`);
	}
}

async function main() {
	const pk = Bun.env.PK;
	if (!pk) {
		console.error("Error: PK environment variable is required (e.g., PK=0x...)");
		process.exit(1);
	}

	const client = new EkidenClient(SDK_CONFIG);

	try {
		// 1. Authenticate and get token
		console.log("--- 1. Authenticating ---");
		const token = await auth(pk, client);
		console.log(`JWT Token obtained: ${token.slice(0, 10)}...`);

		// 2. Fetch tickers via REST API
		console.log("\n--- 2. Fetching Tickers ---");
		const tickers = await client.market.getMarkets();
		console.table(
			tickers.map((t) => ({
				symbol: t.symbol,
				last_price: t.last_price,
				mark_price: t.mark_price,
				index_price: t.index_price,
				volume_24h: t.volume_24h,
				open_interest_value: t.open_interest_value,
			}))
		);

		const symbol = tickers[0]?.symbol || "BTC-WUSDC";

		// 3. Listen to public WS orderbook
		console.log(`\n--- 3. Subscribing to Public Orderbook (depth 10) for ${symbol} ---`);
		const publicStream = client.publicStream;
		if (!publicStream) {
			throw new Error("Public stream not initialized");
		}

		const unsubscribe = publicStream.subscribeOrderbook(symbol, "10", (event) => {
			console.log(`[WS] ${symbol} Orderbook Update:`, {
				bids: event.data.b?.length || 0,
				asks: event.data.a?.length || 0,
				sequence: event.data.seq,
			});
		});

		// Keep alive for 3 seconds to show updates
		console.log("Waiting 3 seconds for updates...");
		await new Promise((resolve) => setTimeout(resolve, 3000));

		unsubscribe();
		publicStream.close();
		console.log("\nDone.");
	} catch (error) {
		console.error("Execution failed:", error instanceof Error ? error.message : error);
	}
}

// Only run main if this file is executed directly
if (import.meta.main) {
	await main();
	process.exit(0);
}
