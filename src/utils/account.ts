import { Account, Ed25519PrivateKey } from "@/crypto";
import { addressToBytes } from "./address";

export interface SubAccountData {
	types: string[][];
	subs: string[];
	nonces: string[];
	orderIndexes: string[];
}

export const decodeHexToString = (hex: string): string => {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
	}
	return new TextDecoder().decode(bytes);
};

export const parseSubAccountsData = (data: any[]): SubAccountData => {
	if (data.length >= 4) {
		return {
			orderIndexes: data[0] || [],
			types: data[1] || [],
			subs: data[3] || [],
			nonces: data[2] || [],
		};
	}
	return {
		types: [],
		subs: [],
		nonces: [],
		orderIndexes: [],
	};
};

/**
 * Message input for wallet signing
 */
export interface AccountMessageInput {
	message: string;
	nonce: string;
}

/**
 * Sub-account data structure
 */
export interface SubAccount {
	address: string;
	publicKey: string;
	type: "funding" | "trading";
	nonce: string;
}

/**
 * Options for creating a sub-account
 */
export interface CreateSubAccountOptions {
	rootAddress: string;
	type: "Funding" | "Trading";
	version?: string;
	nonce?: string;
}

/**
 * Options for creating sub-account deterministically (for keyless wallets)
 */
export interface CreateSubAccountDeterministicOptions extends CreateSubAccountOptions {}

/**
 * Create a message for wallet signing to derive sub-account keys
 * @param rootAddress - Root wallet address
 * @param type - Account type: "Funding" or "Trading"
 * @param version - Protocol version (default: "v2")
 * @param nonce - Account nonce for multiple trading accounts (default: "0")
 * @returns Message input for wallet.signMessage()
 *
 * @example
 * ```typescript
 * const message = createAccountMessage(walletAddress, "Funding");
 * const signature = await wallet.signMessage(message);
 * ```
 */
export const createAccountMessage = (
	rootAddress: string,
	type: "Funding" | "Trading",
	version = "v2",
	nonce = "0"
): AccountMessageInput => ({
	message: `Ekiden ${type}`,
	nonce: `${rootAddress}${type}${version}${nonce}`,
});

/**
 * Build a link proof for connecting sub-account to blockchain
 * @param publicKey - Sub-account public key as Uint8Array
 * @param rootAddress - Root wallet address (will be converted to bytes)
 * @param signature - Sub-account signature of root address as Uint8Array
 * @returns Link proof as Uint8Array
 *
 * @example
 * ```typescript
 * const linkProof = buildLinkProof(
 *   subAccount.publicKey.toUint8Array(),
 *   rootAddress,
 *   subAccount.sign(rootAddress).toUint8Array()
 * );
 * ```
 */
export const buildLinkProof = (
	publicKey: Uint8Array,
	rootAddress: string,
	signature: Uint8Array
): Uint8Array => {
	const rootAddressBytes = addressToBytes(rootAddress);
	return new Uint8Array([...publicKey, ...rootAddressBytes, ...signature]);
};

/**
 * Extract 32-byte private key from wallet signature
 * Supports multiple signature formats from different wallets
 * @param signature - Signature from wallet.signMessage()
 * @returns 32-byte private key as Uint8Array
 */
export const extractPrivateKeyFromSignature = (
	signature: string | Uint8Array | { data: Uint8Array }
): Uint8Array => {
	let bytes: Uint8Array;

	if (signature instanceof Uint8Array) {
		bytes = signature;
	} else if (typeof signature === "string") {
		const hex = signature.startsWith("0x") ? signature.slice(2) : signature;
		bytes = new Uint8Array(hex.length / 2);
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		}
	} else if (signature && typeof signature === "object" && "data" in signature) {
		bytes = signature.data;
	} else {
		throw new Error("Unsupported signature format");
	}

	// Take first 32 bytes for Ed25519 private key
	return bytes.slice(0, 32);
};

/**
 * Create a sub-account deterministically from seed
 * Use this for keyless wallets (Google, Apple) and cross-chain wallets
 * that don't support standard message signing
 *
 * @param options - Creation options
 * @returns SubAccount with address, keys, type and nonce
 *
 * @example
 * ```typescript
 * // For keyless or cross-chain wallets
 * const fundingAccount = await createSubAccountDeterministic({
 *   rootAddress,
 *   type: "Funding",
 * });
 * ```
 */
export const createSubAccountDeterministic = async (
	options: CreateSubAccountDeterministicOptions
): Promise<SubAccount> => {
	const { rootAddress, type, version = "v2", nonce = "0" } = options;

	const seed = `${rootAddress}:${type}:${version}${nonce !== "0" ? `:${nonce}` : ""}`;
	const encoder = new TextEncoder();
	const data = encoder.encode(seed);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const privateKeyBytes = new Uint8Array(hashBuffer);

	const privateKey = new Ed25519PrivateKey(privateKeyBytes);
	const account = Account.fromPrivateKey({ privateKey });

	return {
		address: account.accountAddress.toString(),
		publicKey: account.publicKey.toString(),
		type: type.toLowerCase() as "funding" | "trading",
		nonce,
	};
};

/**
 * Create both funding and trading sub-accounts deterministically
 * For keyless and cross-chain wallets
 *
 * @param rootAddress - Root wallet address
 * @returns Object with funding and trading SubAccounts
 *
 * @example
 * ```typescript
 * // For Google/Apple login or cross-chain wallets
 * const { funding, trading } = await createSubAccountsDeterministic(rootAddress);
 * ```
 */
export const createSubAccountsDeterministic = async (
	rootAddress: string
): Promise<{ funding: SubAccount; trading: SubAccount }> => {
	const funding = await createSubAccountDeterministic({
		rootAddress,
		type: "Funding",
	});

	const trading = await createSubAccountDeterministic({
		rootAddress,
		type: "Trading",
	});

	return { funding, trading };
};

/**
 * Base64-encode an ASCII string using the standard alphabet (with padding).
 *
 * Used to wrap the canonical `AUTHORIZE|…` challenge before handing it to a
 * Canton wallet's `signMessage`, which decodes the base64 back to raw bytes
 * and signs those with plain Ed25519. The challenge is plain ASCII, so `btoa`
 * is safe on every isomorphic target (browser + node/bun).
 */
export const encodeBase64Ascii = (input: string): string => btoa(input);

/**
 * Generate a nonce and message for authorization
 */
export const generateAuthorizePayload = (): {
	timestamp_ms: number;
	nonce: string;
	message: string;
	full_message: string;
} => {
	const timestamp_ms = Date.now();
	const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
	const raw = Array.from(bytes)
		.map((b) => String.fromCharCode(b))
		.join("");
	const nonce = btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

	const message = `AUTHORIZE|${timestamp_ms}|${nonce}`;
	const full_message = ["APTOS", `message: ${message}`, `nonce: ${nonce}`].join("\n");

	return { timestamp_ms, nonce, message, full_message };
};
