// Comprehensive integration example:
// 1. Fetch system info (metadatas and addresses);
// 2. Setup sub-accounts deterministically;
// 3. Request funding from faucet;
// 4. Authenticate (REST + Private WebSocket);
// 5. Subscribe to balance updates and exit.
//
// NOTE: On-chain steps (registration, deposits into funding/trading vaults,
// withdrawals) were previously executed through the Aptos client. They are
// removed for now and will be reimplemented with Canton commands.
// TODO(canton): restore registration / deposit / withdraw flows via Canton.
//
// Required env: PK=<private_key>
// Optional env: NETWORK=prod/staging/dev/local (default: staging)
//
// Note: Root owner PK (private key) is required.
// Supported private key formats:
// - ed25519-priv-0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1
// - 0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1
//
// Example:
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 bun run example/faucet.ts`
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 NETWORK=dev bun run example/faucet.ts`
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 NETWORK=local bun run example/faucet.ts`

import { Account, createSubAccountsDeterministic, Ed25519PrivateKey, EkidenClient } from "../src";
import { auth, SDK_CONFIG } from "./auth";

function isLocalGatewayBaseUrl(baseURL: string): boolean {
	return baseURL.includes("localhost") || baseURL.includes("127.0.0.1");
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`${label} timed out after ${Math.floor(timeoutMs / 1000)}s`));
		}, timeoutMs);

		promise
			.then((value) => {
				clearTimeout(timer);
				resolve(value);
			})
			.catch((error) => {
				clearTimeout(timer);
				reject(error);
			});
	});
}

function envInt(name: string): number | undefined {
	const raw = Bun.env[name];
	if (!raw) return undefined;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export async function fundAccount(
	client: EkidenClient,
	rootAccount: Account,
	quoteAsset: string,
	fundAmount = 500 * 10 ** 6,
	faucetRequestTimeoutMs = 60_000
) {
	console.log("\n--- Requesting Funding from Faucet ---");

	console.log("Submitting faucet request...");
	const fundResult = await withTimeout(
		client.account.fund({
			receiver: rootAccount.accountAddress.toString(),
			metadatas: [quoteAsset],
			amounts: [fundAmount],
		}),
		faucetRequestTimeoutMs,
		"Faucet request"
	);
	console.log(`Requested ${fundAmount / 1e6} USDC from faucet (txid: ${fundResult.txid}).`);
}

async function main() {
	const pk = Bun.env.PK;
	if (!pk) {
		console.error("Error: PK environment variable is required (e.g., PK=0x...)");
		process.exit(1);
	}

	// Initialize Clients
	const client = new EkidenClient(SDK_CONFIG);

	try {
		// 1. Fetch System Info
		console.log("\n--- 1. Fetching System Info ---");
		const systemInfo = await client.system.getSystemInfo();
		const quoteAsset = systemInfo.quote_asset_metadata;
		console.log(`Quote Asset: ${quoteAsset}`);
		console.log(`Perpetual Contract: ${systemInfo.perpetual_addr}`);

		client.config.contractAddress = systemInfo.perpetual_addr;

		// 2. Account Management
		console.log("\n--- 2. Setting up Accounts ---");
		const rootAccount = Account.fromPrivateKey({
			privateKey: new Ed25519PrivateKey(pk),
		});

		const { funding, trading } = await createSubAccountsDeterministic(
			rootAccount.accountAddress.toString()
		);
		console.log(`Root Account: ${rootAccount.accountAddress}`);
		console.log(`Funding Sub-Account: ${funding.address}`);
		console.log(`Trading Sub-Account: ${trading.address}`);

		// 3. Faucet Funding
		const fundAmount = 500 * 10 ** 6; // 500 USDC
		const isLocalGateway = isLocalGatewayBaseUrl(SDK_CONFIG.baseURL);
		const faucetRequestTimeoutMs =
			envInt("FAUCET_REQUEST_TIMEOUT_MS") ?? (isLocalGateway ? 30_000 : 90_000);
		await fundAccount(client, rootAccount, quoteAsset, fundAmount, faucetRequestTimeoutMs);

		// TODO(canton): on-chain registration (create_ekiden_user) via Canton commands.

		// 4. Authenticate
		console.log("\n--- 4. Authenticating ---");
		const [token] = await auth(pk, client);
		await client.setTokens({ rest: token, ws: token, connectPrivateWS: true });
		console.log("Authenticated and Private WS connected.");

		// 5. Subscribe to Balance Updates
		console.log("\n--- 5. Subscribing to Account Balance Updates ---");
		const unsubscribe = client.privateStream?.subscribeAccountBalance((data) => {
			const updates = Array.isArray(data) ? data : [data];
			for (const update of updates) {
				const label =
					update?.account_type || update?.sub_account_address || "unknown-sub-account";
				const balance = update?.available_balance ?? "0";
				console.log(`[WS] Balance Update for ${label}: ${balance}`);
			}
		});

		// TODO(canton): deposit into funding / trading vaults via Canton commands.
		// TODO(canton): withdraw from trading / funding via Canton commands.

		const balances = await client.account.getBalance();
		console.log(`Balance rows: ${balances.list.length}`);

		console.log("\nWaiting 5 seconds for balance updates via WS...");
		await new Promise((resolve) => setTimeout(resolve, 5000));

		if (unsubscribe) unsubscribe();
		client.close();
		console.log("\nDone.");
	} catch (error) {
		console.error("\nExecution failed:");
		if (error instanceof Error) {
			console.error(`Message: ${error.message}`);
			if ("statusCode" in error) {
				console.error(`Status Code: ${(error as any).statusCode}`);
			}
			if ("endpoint" in error) {
				console.error(`Endpoint: ${(error as any).endpoint}`);
			}
		} else {
			console.error(error);
		}

		if (error && typeof error === "object" && "data" in error) {
			console.error("Error data:", (error as any).data);
		}
	}
}

if (import.meta.main) {
	await main();
	process.exit(0);
}
