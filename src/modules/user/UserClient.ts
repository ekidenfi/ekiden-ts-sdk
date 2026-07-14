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
import { generateAuthorizePayload } from "@/utils/account";
import type {
	BindReferralRequest,
	ReferralSummaryResponse,
	RewardHistoryParams,
	RewardSummaryResponse,
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

	async getRewardsSummary(params: RewardHistoryParams = {}): Promise<RewardSummaryResponse> {
		this.ensureAuth();
		return this.request<RewardSummaryResponse>(
			"/user/rewards",
			{},
			{ auth: true, query: params }
		);
	}
}
