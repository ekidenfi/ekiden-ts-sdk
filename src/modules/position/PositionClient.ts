import { BaseHttpClient } from "@/core/base";
import type {
	GetClosedPnlParams,
	GetClosedPnlResponse,
	GetPositionInfoParams,
	GetPositionInfoResponse,
	SetLeverageRequest,
	SetLeverageResponse,
	SetTradingStopRequest,
	SetTradingStopResponse,
} from "@/types/api";

export class PositionClient extends BaseHttpClient {
	async getPositionInfo(params: GetPositionInfoParams): Promise<GetPositionInfoResponse> {
		this.ensureAuth();
		return this.request<GetPositionInfoResponse>(
			"/position/list",
			{},
			{ auth: true, query: params }
		);
	}

	async getClosedPnl(params: GetClosedPnlParams): Promise<GetClosedPnlResponse> {
		this.ensureAuth();
		return this.request<GetClosedPnlResponse>(
			"/position/closed-pnl",
			{},
			{ auth: true, query: params }
		);
	}

	async setLeverage(params: SetLeverageRequest): Promise<SetLeverageResponse> {
		return this.post<SetLeverageResponse>("/position/set-leverage", params);
	}

	async setTradingStop(params: SetTradingStopRequest): Promise<SetTradingStopResponse> {
		return this.post<SetTradingStopResponse>("/position/trading-stop", params);
	}
}
