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

import { BaseHttpClient } from "@/core/base";

export class PositionClient extends BaseHttpClient {
  async getPositionInfo(params: GetPositionInfoParams): Promise<GetPositionInfoResponse> {
    this.ensureAuth();
    return this.request<GetPositionInfoResponse>(
      "/position/list",
      {},
      { auth: true, query: params }
    );
  }

  async getClosedPnl(params: GetClosedPnlParams = {}): Promise<GetClosedPnlResponse> {
    this.ensureAuth();
    return this.request<GetClosedPnlResponse>(
      "/position/closed-pnl",
      {},
      { auth: true, query: params }
    );
  }

  async setLeverage(params: SetLeverageRequest): Promise<SetLeverageResponse> {
    this.ensureAuth();
    return this.request<SetLeverageResponse>(
      "/position/set-leverage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }

  async setTradingStop(params: SetTradingStopRequest): Promise<SetTradingStopResponse> {
    this.ensureAuth();
    return this.request<SetTradingStopResponse>(
      "/position/trading-stop",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }
}
