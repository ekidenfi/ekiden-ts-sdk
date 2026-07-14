import { BaseHttpClient } from "@/core/base";
import type { Account } from "@/crypto";
import { APIError } from "@/core/errors";
import type {
	AuthorizeRequest,
	AuthorizeResponse,
	CreateApiKeyRequest,
	CreateApiKeyResponse,
	GetRootAccountResponse,
	GetSubAccountsResponse,
	ListApiKeysResponse,
} from "@/types/api";
import { generateAccessActivatePayload, generateAuthorizePayload } from "@/utils/account";
import type {
	AccessActivateRequest,
	AccessActivateResponse,
	AccessStatusResponse,
	AffiliateDashboardResponse,
	BindReferralRequest,
	ClaimQuestResponse,
	ReferralSummaryResponse,
	RewardSummaryResponse,
	RewardsLedgerParams,
	UserQuestsResponse,
} from "./types";

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

	async getRewardsSummary(params: RewardsLedgerParams = {}): Promise<RewardSummaryResponse> {
		this.ensureAuth();
		return this.request<RewardSummaryResponse>(
			"/user/rewards",
			{},
			{ auth: true, query: params }
		);
	}

	async getQuests(): Promise<UserQuestsResponse> {
		this.ensureAuth();
		return this.request<UserQuestsResponse>("/user/quests", {}, { auth: true });
	}

	async claimQuest(questId: string): Promise<ClaimQuestResponse> {
		this.ensureAuth();
		return this.post<ClaimQuestResponse>(
			`/user/quests/${encodeURIComponent(questId)}/claim`,
			{}
		);
	}

	async getAccessStatus(): Promise<AccessStatusResponse> {
		this.ensureAuth();
		return this.request<AccessStatusResponse>("/user/access", {}, { auth: true });
	}

	/**
	 * Fetch the authenticated wallet's affiliate dashboard.
	 *
	 * Returns `null` when the wallet is not an affiliate (the endpoint 404s in
	 * that case, which is an expected state, not an error) so callers can
	 * distinguish "not an affiliate" from a real failure. Any other API error
	 * is rethrown.
	 */
	async getAffiliate(): Promise<AffiliateDashboardResponse | null> {
		this.ensureAuth();
		try {
			return await this.request<AffiliateDashboardResponse>(
				"/user/affiliate",
				{},
				{ auth: true }
			);
		} catch (error) {
			if (error instanceof APIError && error.statusCode === 404) {
				return null;
			}
			throw error;
		}
	}

	/**
	 * Submit a pre-signed Stage-1 access-code activation request.
	 *
	 * PUBLIC endpoint (no JWT — the caller cannot have one yet). Prefer
	 * {@link activateAccessCode} to build and sign the request from an account.
	 */
	async activateAccess(params: AccessActivateRequest): Promise<AccessActivateResponse> {
		return this.post<AccessActivateResponse>("/access/activate", params, { auth: false });
	}

	/**
	 * Activate a Stage-1 access code with a wallet account.
	 *
	 * Signs the canonical activation message
	 * `ekiden-stage1-activate:{sha256(normalized code)}:{root_address}:{signed_at}`
	 * with the account (same wallet-signature scheme as {@link authorize}) and
	 * submits it to the PUBLIC `POST /access/activate` endpoint. The body sends
	 * `public_key`, not the address — the server derives the address itself.
	 */
	async activateAccessCode(account: Account, code: string): Promise<AccessActivateResponse> {
		const rootAddress = account.accountAddress.toString();
		const { signedAt, message } = generateAccessActivatePayload(code, rootAddress);
		const messageBytes = new TextEncoder().encode(message);
		const signature = account.sign(messageBytes).toString();

		return this.activateAccess({
			code,
			public_key: account.publicKey.toString(),
			signed_at: signedAt,
			signature,
		});
	}
}
