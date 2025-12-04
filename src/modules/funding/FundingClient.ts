import type { FundingEpochResponse, FundingRateResponse, GetFundingRateParams } from "./types";

import { BaseHttpClient } from "@/core/base";

export class FundingClient extends BaseHttpClient {
  async getFundingRates(params: GetFundingRateParams = {}): Promise<FundingRateResponse[]> {
    return this.request<FundingRateResponse[]>("/market/funding_rate", {}, { query: params });
  }

  async getFundingRateByMarket(marketAddr: string): Promise<FundingRateResponse> {
    return this.request<FundingRateResponse>(`/market/funding_rate/${marketAddr}`);
  }

  async getFundingEpoch(): Promise<FundingEpochResponse> {
    return this.request<FundingEpochResponse>("/market/funding_rate/epoch");
  }
}
