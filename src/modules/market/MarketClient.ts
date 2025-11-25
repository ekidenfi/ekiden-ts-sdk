import {
  CandleResponse,
  GetMarketInfoParams,
  ListCandlesParams,
  MarketResponse,
  MarketStatsResponse,
} from "./types";

import { BaseHttpClient } from "@/core/base";
import { EkidenClientConfig } from "@/core/config";

export class MarketClient extends BaseHttpClient {
  constructor(config: EkidenClientConfig) {
    super(config);
  }

  async getMarkets(): Promise<MarketResponse[]> {
    return this.request<MarketResponse[]>("/market/market_info");
  }

  async getMarketInfo(
    params: GetMarketInfoParams = {},
  ): Promise<MarketResponse[]> {
    return this.request<MarketResponse[]>(
      "/market/market_info",
      {},
      { query: params },
    );
  }

  async getCandles(params: ListCandlesParams): Promise<CandleResponse[]> {
    return this.request<CandleResponse[]>(
      "/market/candles",
      {},
      { query: params },
    );
  }

  async getMarketStats(marketAddr: string): Promise<MarketStatsResponse> {
    return this.request<MarketStatsResponse>(
      `/market/candles/stats/${marketAddr}`,
    );
  }
}
