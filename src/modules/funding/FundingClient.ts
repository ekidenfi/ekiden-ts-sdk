import {
  FundingEpochResponse,
  FundingRateResponse,
  GetFundingRateParams,
} from "./types";

import { BaseHttpClient } from "@/core/base";
import { EkidenClientConfig } from "@/core/config";

export class FundingClient extends BaseHttpClient {
  constructor(config: EkidenClientConfig) {
    super(config);
  }

  async getFundingRates(
    params: GetFundingRateParams = {},
  ): Promise<FundingRateResponse[]> {
    return this.request<FundingRateResponse[]>(
      "/market/funding_rate",
      {},
      { query: params },
    );
  }

  async getFundingRateByMarket(
    marketAddr: string,
  ): Promise<FundingRateResponse> {
    return this.request<FundingRateResponse>(
      `/market/funding_rate/${marketAddr}`,
    );
  }

  async getFundingEpoch(): Promise<FundingEpochResponse> {
    return this.request<FundingEpochResponse>("/market/funding_rate/epoch");
  }
}
