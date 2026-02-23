// API Key / Approved Signer example:
// 1. Authenticate with root wallet (JWT);
// 2. Generate an isolated Ed25519 keypair for a bot;
// 3. Create API key (read + trade scopes) via /user/api-keys;
// 4. Use API-key auth headers automatically through SDK;
// 5. Call private endpoints without Bearer token;
// 6. Revoke API key.
//
// Required env: PK=<root_private_key>
// Optional env: NETWORK=prod/staging/dev/local (default: staging)
//
// Note: Root owner PK (private key) is required.
// Supported private key formats:
// - ed25519-priv-0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1
// - 0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1
//
// Example:
// - `PK=0x... bun run example/api-keys.ts`
// - `PK=0x... NETWORK=dev bun run example/api-keys.ts`
// - `PK=0x... NETWORK=local bun run example/api-keys.ts`

import { Account, Ed25519PrivateKey, EkidenClient } from "../src";
import { auth, SDK_CONFIG } from "./auth";

function randomPrivateKeyHex(): string {
	if (typeof globalThis.crypto?.getRandomValues === "function") {
		const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
		return `0x${Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")}`;
	}

	const fallback = Array.from({ length: 64 }, () =>
		Math.floor(Math.random() * 16).toString(16)
	).join("");
	return `0x${fallback}`;
}

async function main() {
	const pk = Bun.env.PK;
	if (!pk) {
		console.error("Error: PK environment variable is required (e.g., PK=0x...)");
		process.exit(1);
	}

	const rootClient = new EkidenClient(SDK_CONFIG);
	const apiClient = new EkidenClient(SDK_CONFIG);

	let createdKeyId: string | null = null;

	try {
		console.log("--- 1. Root authentication ---");
		const [rootToken] = await auth(pk, rootClient);
		rootClient.setToken(rootToken);
		console.log(`Root JWT obtained: ${rootToken.slice(0, 10)}...`);

		console.log("\n--- 2. Generate bot signer ---");
		const apiSigner = Account.fromPrivateKey({
			privateKey: new Ed25519PrivateKey(randomPrivateKeyHex()),
		});
		const apiPublicKey = apiSigner.publicKey.toString();
		console.log(`Bot public key: ${apiPublicKey}`);

		console.log("\n--- 3. Create API key (read + trade) ---");
		const created = await rootClient.user.createApiKey({
			name: `bot-${Date.now()}`,
			public_key: apiPublicKey,
			scopes: ["read", "trade"],
		});
		createdKeyId = created.id;
		console.log("Created key:", {
			id: created.id,
			public_key: created.public_key,
			scopes: created.scopes,
			created_at: created.created_at,
		});

		console.log("\n--- 4. Configure SDK with API-key auth ---");
		apiClient.setApiKeyAuth({
			publicKey: apiPublicKey,
			sign: (messageBytes) => apiSigner.sign(messageBytes).toString(),
		});

		console.log("\n--- 5. Private calls with API key (no JWT) ---");
		const rootAccount = await apiClient.user.getRootAccount();
		console.log(`Root account via API key: ${rootAccount.root_addr}`);

		const balances = await apiClient.account.getBalance();
		console.log(`Balances rows via API key: ${balances.list.length}`);

		console.log("\n--- 6. List + revoke API key ---");
		const keysBeforeRevoke = await rootClient.user.listApiKeys();
		console.log(`Current API keys count: ${keysBeforeRevoke.keys.length}`);
		console.log(
			"Current API key names:",
			keysBeforeRevoke.keys.map((k) => k.name)
		);

		await rootClient.user.revokeApiKey(created.id);
		createdKeyId = null;
		console.log(`Revoked API key: ${created.id}`);

		console.log("\nDone.");
	} catch (error) {
		console.error("Execution failed:", error instanceof Error ? error.message : error);
	} finally {
		if (createdKeyId) {
			try {
				await rootClient.user.revokeApiKey(createdKeyId);
				console.log(`Cleanup revoke: ${createdKeyId}`);
			} catch {
				// Best-effort cleanup.
			}
		}
		rootClient.close();
		apiClient.close();
	}
}

if (import.meta.main) {
	await main();
	process.exit(0);
}
