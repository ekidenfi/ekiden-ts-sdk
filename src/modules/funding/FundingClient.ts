import { BaseHttpClient } from "@/core/base";

export interface FundingRateInfo {
  market_addr: string;
  funding_rate_percentage: number;
  next_funding_time: string;
  oracle_price: number;
  funding_index: number;
}

export class FundingClient extends BaseHttpClient {
  async getFundingRates(): Promise<FundingRateInfo[]> {
    return this.request<FundingRateInfo[]>("/funding/rates", {});
  }

  async getFundingRateByMarket(marketAddr: string): Promise<FundingRateInfo> {
    return this.request<FundingRateInfo>(
      "/funding/rate",
      {},
      { query: { market_addr: marketAddr } }
    );
  }
}
