import { BaseHttpClient } from "@/core/base";
import type { Account } from "@/crypto";
import type {
	AuthorizeRequest,
	AuthorizeResponse,
	CreateApiKeyRequest,
	CreateApiKeyResponse,
	GetRootAccountResponse,
	GetSubAccountsResponse,
	ListApiKeysResponse,
} from "@/types/api";
import { encodeBase64Ascii, generateAuthorizePayload } from "@/utils/account";
import type {
	BindReferralRequest,
	ReferralSummaryResponse,
	RewardHistoryParams,
	RewardSummaryResponse,
} from "./types";

/**
 * Minimal injected Canton (CIP-103) wallet provider the SDK needs for the
 * Console / self-custody authorize flow. The UI app implements it on top of a
 * browser wallet (e.g. `window.canton`); the SDK never imports a wallet
 * package itself, keeping it isomorphic and dependency-light.
 */
export interface CantonWalletProvider {
	/**
	 * Resolve the wallet's primary account: its Canton `partyId` and the raw
	 * Ed25519 `publicKey` (hex).
	 */
	getPrimaryAccount(): Promise<{ partyId: string; publicKey: string }>;
	/**
	 * Sign `message` — the **base64 of** the canonical
	 * `AUTHORIZE|{timestamp_ms}|{nonce}` challenge. The wallet decodes the
	 * base64 to raw bytes, signs them with plain Ed25519, and returns a base64
	 * `signature`.
	 */
	signMessage(params: { message: string }): Promise<{ signature: string }>;
}

export class UserClient extends BaseHttpClient {
	async authorize(params: AuthorizeRequest): Promise<AuthorizeResponse> {
		const data = await this.post<AuthorizeResponse>("/authorize", params, { auth: false });
		if (data.token) this.setToken(data.token);
		return data;
	}

	async authorizeWithAccount(account: Account): Promise<AuthorizeResponse> {
		const { timestamp_ms, nonce, message } = generateAuthorizePayload();
		const messageBytes = new TextEncoder().encode(message);
		const signature = account.sign(messageBytes).toString();

		return this.authorize({
			signature,
			public_key: account.publicKey.toString(),
			timestamp_ms,
			nonce,
		});
	}

	/**
	 * Authorize with a Canton self-custody (Console) wallet — Branch B.
	 *
	 * Resolves the wallet's primary account, base64-wraps the canonical
	 * `AUTHORIZE|{timestamp_ms}|{nonce}` challenge, has the wallet sign it
	 * (plain Ed25519 over the decoded bytes) and POSTs
	 * `{ party_id, public_key, signature, timestamp_ms, nonce }` to
	 * `/authorize`. The backend verifies the signature plus a party↔key
	 * fingerprint binding.
	 *
	 * The caller injects a {@link CantonWalletProvider}; the SDK depends on no
	 * wallet package. The UI app must still wire the actual `window.canton`
	 * connection behind this interface.
	 */
	async authorizeWithCantonWallet(provider: CantonWalletProvider): Promise<AuthorizeResponse> {
		const { partyId, publicKey } = await provider.getPrimaryAccount();
		const { timestamp_ms, nonce, message } = generateAuthorizePayload();
		const { signature } = await provider.signMessage({
			message: encodeBase64Ascii(message),
		});

		return this.authorize({
			party_id: partyId,
			public_key: publicKey,
			signature,
			timestamp_ms,
			nonce,
		});
	}

	/**
	 * Authorize with an OIDC (Auth0) id_token — Branch A.
	 *
	 * POSTs `{ id_token, nonce, timestamp_ms }` to `/authorize`. The Auth0
	 * login itself is the UI app's job; the SDK only transmits the token.
	 *
	 * IMPORTANT: the `nonce` sent here MUST equal the `nonce` the UI app passed
	 * to Auth0 at login — the backend checks it against the id_token's `nonce`
	 * claim. Pass it via `opts.nonce`. When omitted a fresh nonce is generated,
	 * which is only correct if there is no login-bound nonce to honor.
	 */
	async authorizeWithOidc(
		idToken: string,
		opts?: { nonce?: string }
	): Promise<AuthorizeResponse> {
		const { timestamp_ms, nonce: generatedNonce } = generateAuthorizePayload();
		const nonce = opts?.nonce ?? generatedNonce;

		return this.authorize({
			id_token: idToken,
			nonce,
			timestamp_ms,
		});
	}

	async getRootAccount(): Promise<GetRootAccountResponse> {
		this.ensureAuth();
		return this.request<GetRootAccountResponse>("/user/root-account", {}, { auth: true });
	}

	async getSubAccounts(): Promise<GetSubAccountsResponse> {
		this.ensureAuth();
		return this.request<GetSubAccountsResponse>("/user/sub-accounts", {}, { auth: true });
	}

	async createApiKey(params: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
		return this.post<CreateApiKeyResponse>("/user/api-keys", params);
	}

	async listApiKeys(): Promise<ListApiKeysResponse> {
		this.ensureAuth();
		return this.request<ListApiKeysResponse>("/user/api-keys", {}, { auth: true });
	}

	async revokeApiKey(id: string): Promise<void> {
		this.ensureAuth();
		await this.request<void>(
			`/user/api-keys/${encodeURIComponent(id)}`,
			{ method: "DELETE" },
			{ auth: true }
		);
	}

	async getReferralSummary(): Promise<ReferralSummaryResponse> {
		this.ensureAuth();
		return this.request<ReferralSummaryResponse>("/user/referral", {}, { auth: true });
	}

	async bindReferral(params: BindReferralRequest): Promise<ReferralSummaryResponse> {
		this.ensureAuth();
		return this.post<ReferralSummaryResponse>("/user/referral", params);
	}

	async getRewardsSummary(params: RewardHistoryParams = {}): Promise<RewardSummaryResponse> {
		this.ensureAuth();
		return this.request<RewardSummaryResponse>(
			"/user/rewards",
			{},
			{ auth: true, query: params }
		);
	}
}
