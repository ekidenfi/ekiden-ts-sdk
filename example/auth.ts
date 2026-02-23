// Basic example:
// 1. Authenticate (with either prod/staging/local);
// 2. Fetch tickers via REST API;
// 3. Listen to the public WS orderbook.10.BTC-USDC;
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
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 bun run example/basic.ts`
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 NETWORK=dev bun run example/basic.ts`
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 NETWORK=local bun run example/basic.ts`

import {
	Account,
	Aptos,
	AptosConfig,
	buildLinkProof,
	createSubAccountsDeterministic,
	type Ed25519Account,
	Ed25519PrivateKey,
	EkidenClient,
	Network,
} from "../src";

/**
 * Common configuration for the SDK examples.
 */
const network = Bun.env.NETWORK || "staging";

const getConfigs = (network: string) => {
	switch (network) {
		case "prod":
			return {
				baseURL: "https://api.ekiden.fi",
				wsURL: "wss://api.ekiden.fi/ws/public",
				privateWSURL: "wss://api.ekiden.fi/ws/private",
			};
		case "staging":
			return {
				baseURL: "https://api.staging.ekiden.fi",
				wsURL: "wss://api.staging.ekiden.fi/ws/public",
				privateWSURL: "wss://api.staging.ekiden.fi/ws/private",
			};
		case "dev":
			return {
				baseURL: "https://api.dev.ekiden.fi",
				wsURL: "wss://api.dev.ekiden.fi/ws/public",
				privateWSURL: "wss://api.dev.ekiden.fi/ws/private",
			};
		default:
			return {
				baseURL: "http://localhost:4020",
				wsURL: "ws://localhost:4020/ws/public",
				privateWSURL: "ws://localhost:4020/ws/private",
			};
	}
};

const networkConfig = getConfigs(network);

export const SDK_CONFIG = {
	baseURL: Bun.env.BASE_URL || networkConfig.baseURL,
	wsURL: Bun.env.WS_URL || networkConfig.wsURL,
	privateWSURL: Bun.env.PRIVATE_WS_URL || networkConfig.privateWSURL,
	apiPrefix: "/api/v1",
	contractAddress: "0x1", // Placeholder for local dev
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeFullnodeUrl(raw: string): string {
	const trimmed = raw.trim().replace(/\/+$/, "");
	return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function mapAptosNetwork(name: string): Network {
	const normalized = name.toLowerCase();
	if (normalized.includes("mainnet")) return Network.MAINNET;
	if (normalized.includes("devnet")) return Network.DEVNET;
	if (normalized.includes("local")) return Network.LOCAL;
	return Network.TESTNET;
}

async function canQueryAptosLedger(fullnode: string): Promise<boolean> {
	try {
		const response = await fetch(fullnode, { method: "GET" });
		if (!response.ok) return false;
		const body = (await response.json()) as Record<string, unknown>;
		return typeof body.chain_id !== "undefined";
	} catch {
		return false;
	}
}

async function resolveLocalFullnode(): Promise<string | null> {
	const envUrl = Bun.env.APTOS_NODE_URL || Bun.env.APTOS_REST_URL;
	if (envUrl) {
		const normalized = normalizeFullnodeUrl(envUrl);
		if (await canQueryAptosLedger(normalized)) return normalized;
	}

	const candidates = [
		"http://localhost:8080/v1",
		"http://127.0.0.1:8080/v1",
		"http://localhost:8090/v1",
		"http://127.0.0.1:8090/v1",
	];

	for (const candidate of candidates) {
		if (await canQueryAptosLedger(candidate)) return candidate;
	}

	return null;
}

async function getAptosClient(baseURL: string, aptosNetwork: string): Promise<Aptos> {
	const explicit = Bun.env.APTOS_NODE_URL || Bun.env.APTOS_REST_URL;
	if (explicit) {
		return new Aptos(
			new AptosConfig({
				network: mapAptosNetwork(aptosNetwork),
				fullnode: normalizeFullnodeUrl(explicit),
			})
		);
	}

	const isLocalGateway = baseURL.includes("localhost") || baseURL.includes("127.0.0.1");
	if (isLocalGateway) {
		const localFullnode = await resolveLocalFullnode();
		if (localFullnode) {
			return new Aptos(new AptosConfig({ network: Network.LOCAL, fullnode: localFullnode }));
		}
		return new Aptos(new AptosConfig({ network: Network.LOCAL }));
	}

	return new Aptos(new AptosConfig({ network: mapAptosNetwork(aptosNetwork) }));
}

function shouldAttemptAutoRegister(error: unknown): boolean {
	const message = String(error instanceof Error ? error.message : error).toLowerCase();
	return (
		message.includes("register in the ekiden contract") ||
		message.includes("create_ekiden_user") ||
		message.includes("to obtain a jwt")
	);
}

async function registerEkidenUser(client: EkidenClient, account: Ed25519Account): Promise<void> {
	const systemInfo = await client.system.getSystemInfo();
	client.config.contractAddress = systemInfo.perpetual_addr;

	const aptos = await getAptosClient(client.config.baseURL, systemInfo.aptos_network);
	const rootAddress = account.accountAddress.toString();

	const registrationCheck = await aptos.view({
		payload: {
			function: `${systemInfo.perpetual_addr}::user::is_ekiden_user`,
			functionArguments: [rootAddress],
		},
	});
	const isRegistered = Boolean(registrationCheck[0]);
	if (isRegistered) return;

	const { funding, trading } = await createSubAccountsDeterministic(rootAddress);
	const fundingAccount = Account.fromPrivateKey({
		privateKey: new Ed25519PrivateKey(funding.privateKey),
	});
	const tradingAccount = Account.fromPrivateKey({
		privateKey: new Ed25519PrivateKey(trading.privateKey),
	});

	const rootAddressBytes = account.accountAddress.toUint8Array();
	const fundingLinkProof = buildLinkProof(
		fundingAccount.publicKey.toUint8Array(),
		rootAddress,
		fundingAccount.sign(rootAddressBytes).toUint8Array()
	);
	const tradingLinkProof = buildLinkProof(
		tradingAccount.publicKey.toUint8Array(),
		rootAddress,
		tradingAccount.sign(rootAddressBytes).toUint8Array()
	);

	const payload = client.vaultOnChain.createEkidenUser({
		vaultAddress: systemInfo.perpetual_addr,
		fundingLinkProof,
		crossTradingLinkProof: tradingLinkProof,
	});

	const tx = await aptos.transaction.build.simple({
		sender: account.accountAddress,
		data: payload as any,
	});
	const senderAuthenticator = aptos.transaction.sign({
		signer: account,
		transaction: tx,
	});
	const committedTx = await aptos.transaction.submit.simple({
		transaction: tx,
		senderAuthenticator,
	});
	await aptos.waitForTransaction({ transactionHash: committedTx.hash });
}

/**
 * Authenticates with the Ekiden backend and returns a JWT token.
 * Reusable across different example scripts.
 *
 * @param pk - Ed25519 private key hex
 * @returns JWT token string
 */
export async function auth(
	pk: string,
	client = new EkidenClient(SDK_CONFIG)
): Promise<[string, Ed25519Account]> {
	const account = Account.fromPrivateKey({
		privateKey: new Ed25519PrivateKey(pk),
	});
	try {
		const response = await client.user.authorizeWithAccount(account);
		return [response.token, account];
	} catch (error) {
		if (!shouldAttemptAutoRegister(error)) {
			throw new Error(
				`Authentication failed: ${error instanceof Error ? error.message : error}`
			);
		}

		console.log(
			"Auth failed because user is not registered. Running create_ekiden_user on Aptos..."
		);
		try {
			await registerEkidenUser(client, account);
		} catch (registerError) {
			const registerMessage = String(
				registerError instanceof Error ? registerError.message : registerError
			);
			if (
				registerMessage.includes("ECONNREFUSED") ||
				registerMessage.includes("ENOTFOUND") ||
				registerMessage.includes("fetch failed")
			) {
				throw new Error(
					`Authentication failed: auto-register error: cannot reach Aptos fullnode. Set APTOS_REST_URL (or APTOS_NODE_URL), e.g. APTOS_REST_URL=http://localhost:8080/v1`
				);
			}
			throw new Error(`Authentication failed: auto-register error: ${registerMessage}`);
		}

		for (let attempt = 0; attempt < 30; attempt++) {
			try {
				const response = await client.user.authorizeWithAccount(account);
				return [response.token, account];
			} catch (retryError) {
				if (attempt === 29) {
					throw new Error(
						`Authentication failed after auto-register: ${retryError instanceof Error ? retryError.message : retryError}`
					);
				}
				await sleep(2000);
			}
		}

		throw new Error("Authentication failed after auto-register: unknown error");
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
		const [token] = await auth(pk, client);
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
