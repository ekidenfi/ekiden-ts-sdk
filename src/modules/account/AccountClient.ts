import { BaseHttpClient } from "@/core/base";
import type {
	ApiWithdrawRequest,
	ApiWithdrawResponse,
	FundRequest,
	FundResult,
	GetAccountBalanceResponse,
} from "@/types/api";

export class AccountClient extends BaseHttpClient {
	async getBalance(): Promise<GetAccountBalanceResponse> {
		this.ensureAuth();
		return this.request<GetAccountBalanceResponse>("/account/balance", {}, { auth: true });
	}

	async fund(params: FundRequest): Promise<FundResult> {
		return this.post<FundResult>("/account/fund", params, { auth: false });
	}

	async withdraw(params: ApiWithdrawRequest): Promise<ApiWithdrawResponse> {
		return this.post<ApiWithdrawResponse>("/account/withdraw", params);
	}
}
