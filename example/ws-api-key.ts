// API-key WebSocket auth (wscat helper)
//
// Goal: generate a wscat-ready JSON message for `op=auth_api_key`.
//
// Required env:
// - API_KEY_PRIVATE_KEY=<api key private key>
// Optional env:
// - NETWORK=prod/staging/dev/local (default: staging)
// - PRIVATE_WS_URL=ws(s)://.../ws/private (overrides NETWORK)
// - WS_URL=ws(s)://.../ws/private (overrides PRIVATE_WS_URL)
// - API_KEY_PUBLIC_KEY=0x... (optional; asserts the derived public key matches)
//
// Notes:
// - The auth payload expires quickly (timestamp window ~30s).
// - The nonce is single-use (replay will fail).
//
// Examples:
// - `API_KEY_PRIVATE_KEY=0x... bun run example/ws-api-key-wscat.ts`
// - `API_KEY_PRIVATE_KEY=0x... NETWORK=local bun run example/ws-api-key-wscat.ts`
// - `API_KEY_PRIVATE_KEY=0x... PRIVATE_WS_URL=ws://localhost:4020/ws/private bun run example/ws-api-key-wscat.ts`

import { Account, Ed25519PrivateKey, PrivateKey, PrivateKeyVariants } from "../src";
import { SDK_CONFIG } from "./auth";

const wsUrl = Bun.env.WS_URL || Bun.env.PRIVATE_WS_URL || SDK_CONFIG.privateWSURL;
const privateKeyRaw = Bun.env.API_KEY_PRIVATE_KEY;

function normalizePrivateKey(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) throw new Error("API_KEY_PRIVATE_KEY is empty");
	if (trimmed.startsWith("ed25519-priv-")) return trimmed;
	const hex = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
	if (!/^0x[a-fA-F0-9]{64}$/.test(hex)) {
		throw new Error(
			"API_KEY_PRIVATE_KEY must be 32 bytes hex (64 chars), e.g. `ed25519-priv-<hex>` or `<hex>`"
		);
	}
	return PrivateKey.formatPrivateKey(hex, PrivateKeyVariants.Ed25519);
}

function urlSafeBase64(bytes: Uint8Array): string {
	return Buffer.from(bytes)
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}

async function main() {
	if (!privateKeyRaw) {
		console.error(
			"Error: API_KEY_PRIVATE_KEY env var is required (paste the API key *private key* from the Create API Key modal)"
		);
		process.exit(1);
	}

	const normalizedPk = normalizePrivateKey(privateKeyRaw);
	const privateKey = new Ed25519PrivateKey(normalizedPk, true);
	const account = Account.fromPrivateKey({ privateKey });

	const nonceBytes = new Uint8Array(16);
	crypto.getRandomValues(nonceBytes);

	const timestamp_ms = Date.now();
	const nonce = urlSafeBase64(nonceBytes);
	const message = `EKIDEN_WS|AUTH|${timestamp_ms}|${nonce}`;
	const signature = account.sign(new TextEncoder().encode(message)).toString();
	const api_key = account.publicKey.toString();

	const expectedApiKeyRaw = Bun.env.API_KEY_PUBLIC_KEY;
	if (expectedApiKeyRaw) {
		const expected = expectedApiKeyRaw.trim().startsWith("0x")
			? expectedApiKeyRaw.trim()
			: `0x${expectedApiKeyRaw.trim()}`;
		if (expected !== api_key) {
			console.error("Error: API_KEY_PUBLIC_KEY does not match derived public key");
			console.error("expected:", expected);
			console.error("derived :", api_key);
			process.exit(1);
		}
	}

	const authRequest = {
		op: "auth_api_key",
		api_key,
		signature,
		timestamp_ms,
		nonce,
		req_id: "auth_1",
	};

	console.log("[info] api_key (public key):", api_key);
	console.log("\n--- wscat ---");
	console.log(`# 1) Connect:\nwscat -c ${wsUrl}`);
	console.log("\n# 2) Paste this auth message (expires quickly; nonce is single-use):");
	console.log(JSON.stringify(authRequest));
}

if (import.meta.main) {
	await main();
	process.exit(0);
}
