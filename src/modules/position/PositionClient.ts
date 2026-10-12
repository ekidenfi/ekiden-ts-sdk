import { BaseHttpClient } from "@/core/base";
import type {
	AdjustIsolatedMarginRequest,
	AdjustIsolatedMarginResponse,
	GetClosedPnlParams,
	GetClosedPnlResponse,
	GetMarginModesParams,
	GetMarginModesResponse,
	GetPositionInfoParams,
	GetPositionInfoResponse,
	SetLeverageRequest,
	SetLeverageResponse,
	SetMarginModeRequest,
	SetMarginModeResponse,
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

	async setMarginMode(params: SetMarginModeRequest): Promise<SetMarginModeResponse> {
		return this.post<SetMarginModeResponse>("/position/set-margin-mode", params);
	}

	async adjustIsolatedMargin(
		params: AdjustIsolatedMarginRequest
	): Promise<AdjustIsolatedMarginResponse> {
		return this.post<AdjustIsolatedMarginResponse>("/position/adjust-isolated-margin", params);
	}

	async getMarginModes(params: GetMarginModesParams): Promise<GetMarginModesResponse> {
		this.ensureAuth();
		return this.request<GetMarginModesResponse>(
			"/position/margin-modes",
			{},
			{ auth: true, query: params }
		);
	}

	async setTradingStop(params: SetTradingStopRequest): Promise<SetTradingStopResponse> {
		return this.post<SetTradingStopResponse>("/position/trading-stop", params);
	}
}
