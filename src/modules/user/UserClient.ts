import { BaseHttpClient } from "@/core/base";
import { APIError } from "@/core/errors";
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
import { generateAuthorizePayload } from "@/utils/account";
import type {
	AccessActivateRequest,
	AccessActivateResponse,
	AccessStatusResponse,
	AffiliateDashboardResponse,
	BindReferralRequest,
	ClaimQuestResponse,
	CreateReferralCodeRequest,
	ListReferralCodesResponse,
	RecordReferralClickRequest,
	RedeemSeasonClaimRequest,
	RedeemSeasonClaimResponse,
	ReferralCodeInfo,
	ReferralSummaryResponse,
	RewardSummaryResponse,
	RewardsLedgerParams,
	SeasonClaimVoucherResponse,
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

	/**
	 * Create a vanity referral code for the authenticated user.
	 *
	 * Requires a full-scope root session; bound sub-accounts are rejected
	 * (`APIError` `statusCode` 403). Throws `APIError` 400 on a malformed /
	 * reserved / duplicate code or when the per-user cap is reached.
	 */
	async createReferralCode(params: CreateReferralCodeRequest): Promise<ReferralCodeInfo> {
		this.ensureAuth();
		return this.post<ReferralCodeInfo>("/user/referral-codes", params);
	}

	/**
	 * List the authenticated user's referral codes with per-code funnel counts
	 * (clicks / binds / downline). Requires a root session; bound sub-accounts
	 * are rejected (`APIError` `statusCode` 403).
	 */
	async listReferralCodes(): Promise<ListReferralCodesResponse> {
		this.ensureAuth();
		return this.request<ListReferralCodesResponse>("/user/referral-codes", {}, { auth: true });
	}

	/**
	 * Delete one of the user's referral codes by id. The default code cannot be
	 * deleted (`APIError` 400); an unknown id 404s. Requires a full-scope root
	 * session; bound sub-accounts are rejected (403).
	 */
	async deleteReferralCode(codeId: string): Promise<void> {
		this.ensureAuth();
		await this.request<void>(
			`/user/referral-codes/${encodeURIComponent(codeId)}`,
			{ method: "DELETE" },
			{ auth: true }
		);
	}

	/**
	 * Record a referral-link click for `code`.
	 *
	 * PUBLIC endpoint (no JWT) — callable on an unauthenticated client from the
	 * `/r/{code}` capture page. Anti-enumeration: a well-formed code always
	 * succeeds whether or not it exists; throws `APIError` 400 only on a
	 * structurally malformed code.
	 */
	async trackReferralClick(params: RecordReferralClickRequest): Promise<void> {
		await this.post<void>("/referral/click", params, { auth: false });
	}

	/**
	 * Fetch the reward summary: XP balance, rank, per-source breakdown and one
	 * cursor-paginated page of the instant-XP ledger (newest first). Pass
	 * `cursor` (from a previous response's `next_cursor`) to page; `next_cursor`
	 * is `null` on the last page.
	 */
	async getRewardsSummary(params: RewardsLedgerParams = {}): Promise<RewardSummaryResponse> {
		this.ensureAuth();
		return this.request<RewardSummaryResponse>(
			"/user/rewards",
			{},
			{ auth: true, query: params }
		);
	}

	/** List the viewer's active quests, each with its current claim state. */
	async getQuests(): Promise<UserQuestsResponse> {
		this.ensureAuth();
		return this.request<UserQuestsResponse>("/user/quests", {}, { auth: true });
	}

	/**
	 * Claim a `manual_claim` quest by id; resolves with the credited reward.
	 * Throws {@link APIError} with `statusCode` 400 on repeat / inactive /
	 * ineligible claims.
	 */
	async claimQuest(questId: string): Promise<ClaimQuestResponse> {
		this.ensureAuth();
		return this.post<ClaimQuestResponse>(
			`/user/quests/${encodeURIComponent(questId)}/claim`,
			{}
		);
	}

	/** Fetch the wallet's Stage-1 standing: activation, badge and multiplier. */
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
	 * Redeem a Stage-1 closed-launch access code for the authenticated wallet.
	 *
	 * AUTHENTICATED: identity comes from the session, so the body is just the
	 * code. This replaced a pre-auth signed challenge that custodial (Auth0)
	 * wallets could not produce — they hold no signing key — which is why the
	 * signing helpers and the account-based convenience wrapper are gone.
	 *
	 * On rejection throws {@link APIError} with the server `statusCode`: 400
	 * invalid/expired/revoked code, 403 a bound sub-account session, 404 access
	 * module disabled, 409 already used/activated, 429 rate limited.
	 */
	async activateAccess(params: AccessActivateRequest): Promise<AccessActivateResponse> {
		return this.post<AccessActivateResponse>("/user/access/activate", params);
	}

	async seasonClaimVoucher(): Promise<SeasonClaimVoucherResponse> {
		this.ensureAuth();
		// Empty body: pass {}, never undefined (post() JSON.stringifies params).
		return this.post<SeasonClaimVoucherResponse>("/user/season-claim/voucher", {});
	}

	async seasonClaimRedeem(params: RedeemSeasonClaimRequest): Promise<RedeemSeasonClaimResponse> {
		this.ensureAuth();
		return this.post<RedeemSeasonClaimResponse>("/user/season-claim/redeem", params);
	}
}
