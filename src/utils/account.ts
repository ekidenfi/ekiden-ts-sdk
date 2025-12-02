import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

import { addressToBytes } from "./address";

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
  privateKey: string;
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
 * Options for creating sub-account from signature
 */
export interface CreateSubAccountFromSignatureOptions
  extends CreateSubAccountOptions {
  signature: string | Uint8Array;
}

/**
 * Options for creating sub-account deterministically (for keyless wallets)
 */
export interface CreateSubAccountDeterministicOptions
  extends CreateSubAccountOptions {}

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
  version: string = "v2",
  nonce: string = "0",
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
 *
 * const payload = vaultOnChain.createEkidenUser({
 *   vaultAddress: CONTRACT.VAULT,
 *   fundingLinkProof: linkProof,
 *   crossTradingLinkProof: tradingLinkProof,
 * });
 * ```
 */
export const buildLinkProof = (
  publicKey: Uint8Array,
  rootAddress: string,
  signature: Uint8Array,
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
  signature: string | Uint8Array | { data: Uint8Array },
): Uint8Array => {
  let bytes: Uint8Array;

  if (signature instanceof Uint8Array) {
    bytes = signature;
  } else if (typeof signature === "string") {
    const hex = signature.startsWith("0x") ? signature.slice(2) : signature;
    bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
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
 * Create a sub-account from wallet signature
 * Use this for standard wallets that support message signing
 *
 * @param options - Creation options with signature
 * @returns SubAccount with address, keys, type and nonce
 *
 * @example
 * ```typescript
 * const message = createAccountMessage(rootAddress, "Funding");
 * const signResult = await wallet.signMessage(message);
 *
 * const fundingAccount = createSubAccountFromSignature({
 *   rootAddress,
 *   type: "Funding",
 *   signature: signResult.signature,
 * });
 * ```
 */
export const createSubAccountFromSignature = (
  options: CreateSubAccountFromSignatureOptions,
): SubAccount => {
  const { rootAddress, type, version = "v2", nonce = "0", signature } = options;

  const privateKeyBytes = extractPrivateKeyFromSignature(signature);
  const privateKey = new Ed25519PrivateKey(privateKeyBytes);
  const account = Account.fromPrivateKey({ privateKey });

  return {
    address: account.accountAddress.toString(),
    privateKey: privateKey.toString(),
    publicKey: account.publicKey.toString(),
    type: type.toLowerCase() as "funding" | "trading",
    nonce,
  };
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
  options: CreateSubAccountDeterministicOptions,
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
    privateKey: privateKey.toString(),
    publicKey: account.publicKey.toString(),
    type: type.toLowerCase() as "funding" | "trading",
    nonce,
  };
};

/**
 * Create both funding and trading sub-accounts from signatures
 *
 * @param rootAddress - Root wallet address
 * @param fundingSignature - Signature for funding account
 * @param tradingSignature - Signature for trading account
 * @returns Object with funding and trading SubAccounts
 *
 * @example
 * ```typescript
 * const fundingMsg = createAccountMessage(rootAddress, "Funding");
 * const tradingMsg = createAccountMessage(rootAddress, "Trading");
 *
 * const fundingSig = await wallet.signMessage(fundingMsg);
 * const tradingSig = await wallet.signMessage(tradingMsg);
 *
 * const { funding, trading } = createSubAccounts(
 *   rootAddress,
 *   fundingSig.signature,
 *   tradingSig.signature
 * );
 * ```
 */
export const createSubAccounts = (
  rootAddress: string,
  fundingSignature: string | Uint8Array,
  tradingSignature: string | Uint8Array,
): { funding: SubAccount; trading: SubAccount } => {
  const funding = createSubAccountFromSignature({
    rootAddress,
    type: "Funding",
    signature: fundingSignature,
  });

  const trading = createSubAccountFromSignature({
    rootAddress,
    type: "Trading",
    signature: tradingSignature,
  });

  return { funding, trading };
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
  rootAddress: string,
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

export interface MasterSignaturePayload {
  message: string;
  nonce: string;
}

export interface DeriveFromMasterSignatureOptions {
  masterSignature: string | Uint8Array;
  type: "Funding" | "Trading";
  nonce?: string;
}

export const createMasterSignaturePayload = (
  rootAddress: string,
  version: number = 1,
): MasterSignaturePayload => ({
  message: "Ekiden Account Derivation",
  nonce: `${rootAddress}:${version}`,
});

export const deriveSubAccountFromMasterSignature = async (
  options: DeriveFromMasterSignatureOptions,
): Promise<SubAccount> => {
  const { masterSignature, type, nonce = "0" } = options;

  const signatureBytes = extractPrivateKeyFromSignature(masterSignature);

  const encoder = new TextEncoder();
  const typeBytes = encoder.encode(type);
  const nonceBytes = encoder.encode(nonce);

  const combinedData = new Uint8Array([
    ...signatureBytes,
    ...typeBytes,
    ...nonceBytes,
  ]);

  const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData);
  const privateKeyBytes = new Uint8Array(hashBuffer);

  const privateKey = new Ed25519PrivateKey(privateKeyBytes);
  const account = Account.fromPrivateKey({ privateKey });

  return {
    address: account.accountAddress.toString(),
    privateKey: privateKey.toString(),
    publicKey: account.publicKey.toString(),
    type: type.toLowerCase() as "funding" | "trading",
    nonce,
  };
};

export const deriveSubAccountsFromMasterSignature = async (
  masterSignature: string | Uint8Array,
): Promise<{ funding: SubAccount; trading: SubAccount }> => {
  const funding = await deriveSubAccountFromMasterSignature({
    masterSignature,
    type: "Funding",
    nonce: "0",
  });

  const trading = await deriveSubAccountFromMasterSignature({
    masterSignature,
    type: "Trading",
    nonce: "0",
  });

  return { funding, trading };
};

export const deriveTradingAccountFromMasterSignature = async (
  masterSignature: string | Uint8Array,
  nonce: string,
): Promise<SubAccount> => {
  return deriveSubAccountFromMasterSignature({
    masterSignature,
    type: "Trading",
    nonce,
  });
};
