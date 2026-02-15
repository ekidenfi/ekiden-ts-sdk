import { BaseHttpClient } from "@/core/base";
import type {
	ApiWithdrawRequest,
	ApiWithdrawResponse,
	FundRequest,
	FundResult,
	GetAccountBalanceResponse,
} from "@/types/api";

export type AccountStatisticsStep = "hour" | "day" | "week" | "month" | "h" | "d" | "w" | "m";

export type AccountStatisticsSortingOrder = "asc" | "desc";

export interface AccountStatisticsParams {
	sub_account_address?: string | null;
	start_time?: string | null;
	end_time?: string | null;
	step?: AccountStatisticsStep | null;
	limit?: number | null;
	sorting_order?: AccountStatisticsSortingOrder | null;
}

export interface AccountStatisticsEntry {
	equity: string;
	realised_pnl_cum: string;
	roi: string;
	sub_account_address: string;
	timestamp: string;
	unrealised_pnl: string;
	volume: string;
}

export interface AccountStatisticsResponse {
	list: AccountStatisticsEntry[];
}

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

	async getStatistics(params?: AccountStatisticsParams): Promise<AccountStatisticsResponse> {
		this.ensureAuth();
		return this.request<AccountStatisticsResponse>(
			"/account/statistics",
			{},
			{ auth: true, query: params }
		);
	}
}
