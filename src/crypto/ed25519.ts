import { ed25519 } from "@noble/curves/ed25519.js";
import { sha3_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

const PRIVATE_KEY_LENGTH = 32;
const AIP80_ED25519_PREFIX = "ed25519-priv-";

const normalizeHexInput = (value: string): Uint8Array => {
	let hex = value.trim();
	if (hex.startsWith(AIP80_ED25519_PREFIX)) {
		hex = hex.slice(AIP80_ED25519_PREFIX.length);
	}
	if (hex.startsWith("0x")) {
		hex = hex.slice(2);
	}
	return hexToBytes(hex);
};

export class Ed25519PublicKey {
	private readonly key: Uint8Array;

	constructor(key: Uint8Array | string) {
		this.key = typeof key === "string" ? normalizeHexInput(key) : key;
	}

	toUint8Array(): Uint8Array {
		return this.key;
	}

	toString(): string {
		return `0x${bytesToHex(this.key)}`;
	}
}

export class Ed25519Signature {
	private readonly signature: Uint8Array;

	constructor(signature: Uint8Array) {
		this.signature = signature;
	}

	toUint8Array(): Uint8Array {
		return this.signature;
	}

	toString(): string {
		return `0x${bytesToHex(this.signature)}`;
	}
}

export class AccountAddress {
	private readonly address: Uint8Array;

	constructor(address: Uint8Array) {
		this.address = address;
	}

	static from(value: string | Uint8Array | AccountAddress): AccountAddress {
		if (value instanceof AccountAddress) return value;
		if (value instanceof Uint8Array) return new AccountAddress(value);
		const hex = value.startsWith("0x") ? value.slice(2) : value;
		return new AccountAddress(hexToBytes(hex.padStart(64, "0")));
	}

	toUint8Array(): Uint8Array {
		return this.address;
	}

	bcsToBytes(): Uint8Array {
		return this.address;
	}

	toString(): string {
		return `0x${bytesToHex(this.address)}`;
	}
}

export class Ed25519PrivateKey {
	private readonly key: Uint8Array;

	constructor(value: string | Uint8Array) {
		const bytes = typeof value === "string" ? normalizeHexInput(value) : value;
		if (bytes.length !== PRIVATE_KEY_LENGTH) {
			throw new Error(
				`Invalid Ed25519 private key length: expected ${PRIVATE_KEY_LENGTH} bytes, got ${bytes.length}`
			);
		}
		this.key = bytes;
	}

	publicKey(): Ed25519PublicKey {
		return new Ed25519PublicKey(ed25519.getPublicKey(this.key));
	}

	sign(message: Uint8Array): Ed25519Signature {
		return new Ed25519Signature(ed25519.sign(message, this.key));
	}

	toUint8Array(): Uint8Array {
		return this.key;
	}

	toString(): string {
		return `0x${bytesToHex(this.key)}`;
	}
}

/**
 * Ed25519 account with legacy address derivation
 * (sha3-256 over public key + single-signature scheme byte),
 * kept for compatibility with existing sub-account addresses.
 */
export class Account {
	readonly privateKey: Ed25519PrivateKey;
	readonly publicKey: Ed25519PublicKey;
	readonly accountAddress: AccountAddress;

	private constructor(privateKey: Ed25519PrivateKey) {
		this.privateKey = privateKey;
		this.publicKey = privateKey.publicKey();

		const authKeyInput = new Uint8Array([...this.publicKey.toUint8Array(), 0]);
		this.accountAddress = new AccountAddress(sha3_256(authKeyInput));
	}

	static fromPrivateKey({ privateKey }: { privateKey: Ed25519PrivateKey }): Account {
		return new Account(privateKey);
	}

	static generate(): Account {
		return new Account(new Ed25519PrivateKey(ed25519.utils.randomSecretKey()));
	}

	sign(message: Uint8Array): Ed25519Signature {
		return this.privateKey.sign(message);
	}
}

export type Ed25519Account = Account;
