// Generate multiple funding and trading sub-accounts for testing
//
// Usage:
//   PK=0x<your_private_key> node ./example/generate-accounts.js
//
// This script will generate 10 funding accounts and 10 trading accounts
// and output their addresses, public keys, and private keys to the console.
// No blockchain interaction - purely local key derivation.

import { Ed25519Account, Ed25519PrivateKey, PrivateKey } from "@aptos-labs/ts-sdk";

import "dotenv/config";

// Configuration
const NUM_ACCOUNTS = 10; // Number of each type to generate

// Helper functions
const hexWithout0x = (h) => (h?.startsWith("0x") ? h.slice(2) : h || "");
const hexToBytes = (hex) => {
	const clean = hexWithout0x(hex);
	if (clean.length % 2 !== 0) throw new Error("Invalid hex");
	const out = new Uint8Array(clean.length / 2);
	for (let i = 0; i < out.length; i++)
		out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
	return out;
};
const bytesToHex = (bytes) =>
	`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;

// Normalize private key to AIP-80 ed25519 format
function normalizeSecretKey(pkHex) {
	if (!pkHex) throw new Error("Missing private key");
	const raw = hexWithout0x(String(pkHex).trim());
	const hex64 = raw.length === 128 ? raw.slice(0, 64) : raw;
	const with0x = `0x${hex64}`;
	return PrivateKey.formatPrivateKey(with0x, "ed25519");
}

// Build full APTOS message
function buildAptosFullMessage(message, nonce) {
	return `APTOS\nmessage: ${message}\nnonce: ${nonce}`;
}

// Derive funding account
function deriveFundingAccount(ownerAccount, rootAddress, nonce = "0") {
	const msg = buildAptosFullMessage(
		"Ekiden Funding",
		`${rootAddress.toLowerCase()}Fundingv2${nonce}`
	);
	const sigHex = ownerAccount.sign(new TextEncoder().encode(msg)).toString();
	const seed32 = hexToBytes(sigHex).slice(0, 32);
	const formatted = PrivateKey.formatPrivateKey(bytesToHex(seed32), "ed25519");
	return new Ed25519Account({ privateKey: new Ed25519PrivateKey(formatted) });
}

// Derive trading account
function deriveTradingAccount(ownerAccount, rootAddress, nonce = "0") {
	const msg = buildAptosFullMessage(
		"Ekiden Trading",
		`${rootAddress.toLowerCase()}Tradingv2${nonce}`
	);
	const sigHex = ownerAccount.sign(new TextEncoder().encode(msg)).toString();
	const seed32 = hexToBytes(sigHex).slice(0, 32);
	const formatted = PrivateKey.formatPrivateKey(bytesToHex(seed32), "ed25519");
	return new Ed25519Account({ privateKey: new Ed25519PrivateKey(formatted) });
}

async function main() {
	const PK = process.env.PK;
	if (!PK) {
		console.error("Error: PK environment variable is required");
		console.error("Usage: PK=0x<your_private_key> node ./example/generate-accounts.js");
		process.exit(1);
	}

	// Build root account
	const rootAcc = new Ed25519Account({
		privateKey: new Ed25519PrivateKey(normalizeSecretKey(PK)),
	});
	const rootAddress = rootAcc.accountAddress.toString();

	console.log("=".repeat(80));
	console.log("ACCOUNT GENERATION");
	console.log("=".repeat(80));
	console.log(`Root Account Address: ${rootAddress}`);
	console.log(`Root Public Key: ${rootAcc.publicKey.toString()}`);
	console.log("");

	// Generate Funding Accounts
	console.log("=".repeat(80));
	console.log(`FUNDING ACCOUNTS (${NUM_ACCOUNTS} accounts)`);
	console.log("=".repeat(80));

	const fundingAccounts = [];
	for (let i = 0; i < NUM_ACCOUNTS; i++) {
		const account = deriveFundingAccount(rootAcc, rootAddress, i.toString());
		fundingAccounts.push({
			nonce: i,
			address: account.accountAddress.toString(),
			publicKey: account.publicKey.toString(),
			privateKey: account.privateKey.toString(),
		});

		console.log(`\nFunding Account #${i}:`);
		console.log(`  Nonce: ${i}`);
		console.log(`  Address: ${account.accountAddress.toString()}`);
		console.log(`  Public Key: ${account.publicKey.toString()}`);
		console.log(`  Private Key: ${account.privateKey.toString()}`);
	}

	// Generate Trading Accounts
	console.log(`\n${"=".repeat(80)}`);
	console.log(`TRADING ACCOUNTS (${NUM_ACCOUNTS} accounts)`);
	console.log("=".repeat(80));

	const tradingAccounts = [];
	for (let i = 0; i < NUM_ACCOUNTS; i++) {
		const account = deriveTradingAccount(rootAcc, rootAddress, i.toString());
		tradingAccounts.push({
			nonce: i,
			address: account.accountAddress.toString(),
			publicKey: account.publicKey.toString(),
			privateKey: account.privateKey.toString(),
		});

		console.log(`\nTrading Account #${i}:`);
		console.log(`  Nonce: ${i}`);
		console.log(`  Address: ${account.accountAddress.toString()}`);
		console.log(`  Public Key: ${account.publicKey.toString()}`);
		console.log(`  Private Key: ${account.privateKey.toString()}`);
	}

	// Summary
	console.log(`\n${"=".repeat(80)}`);
	console.log("SUMMARY");
	console.log("=".repeat(80));
	console.log(`Total Funding Accounts: ${fundingAccounts.length}`);
	console.log(`Total Trading Accounts: ${tradingAccounts.length}`);
	console.log("");

	// Output in JSON format for easy copying
	console.log("=".repeat(80));
	console.log("JSON OUTPUT (for easy copying)");
	console.log("=".repeat(80));
	console.log(
		JSON.stringify(
			{
				rootAccount: {
					address: rootAddress,
					publicKey: rootAcc.publicKey.toString(),
				},
				fundingAccounts,
				tradingAccounts,
			},
			null,
			2
		)
	);
}

main().catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
