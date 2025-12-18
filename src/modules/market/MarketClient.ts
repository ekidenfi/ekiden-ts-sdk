import type {
  GetFundingRateHistoryParams,
  GetFundingRateHistoryResponse,
  GetIndexPriceKlineParams,
  GetKlineParams,
  GetKlineResponse,
  GetLongShortRatioParams,
  GetLongShortRatioResponse,
  GetMarkPriceKlineParams,
  GetOpenInterestParams,
  GetOpenInterestResponse,
  GetOrderBookParams,
  GetOrderBookResponse,
  GetPriceKlineResponse,
  GetRiskLimitParams,
  GetRiskLimitResponse,
  GetTickersParams,
  GetTickersResponse,
  OrderPriceLimit,
  SymbolName,
} from "@/types/api";

import { BaseHttpClient } from "@/core/base";

export class MarketClient extends BaseHttpClient {
  async getTickers(params: GetTickersParams = {}): Promise<GetTickersResponse> {
    return this.request<GetTickersResponse>("/market/tickers", {}, { query: params });
  }

  async getOrderbook(params: GetOrderBookParams): Promise<GetOrderBookResponse> {
    return this.request<GetOrderBookResponse>("/market/orderbook", {}, { query: params });
  }

  async getKline(params: GetKlineParams): Promise<GetKlineResponse> {
    return this.request<GetKlineResponse>("/market/kline", {}, { query: params });
  }

  async getMarkPriceKline(params: GetMarkPriceKlineParams): Promise<GetPriceKlineResponse> {
    return this.request<GetPriceKlineResponse>("/market/mark-price-kline", {}, { query: params });
  }

  async getIndexPriceKline(params: GetIndexPriceKlineParams): Promise<GetPriceKlineResponse> {
    return this.request<GetPriceKlineResponse>("/market/index-price-kline", {}, { query: params });
  }

  async getFundingRateHistory(
    params: GetFundingRateHistoryParams
  ): Promise<GetFundingRateHistoryResponse> {
    return this.request<GetFundingRateHistoryResponse>(
      "/market/funding/history",
      {},
      { query: params }
    );
  }

  async getOpenInterest(params: GetOpenInterestParams): Promise<GetOpenInterestResponse> {
    return this.request<GetOpenInterestResponse>("/market/open-interest", {}, { query: params });
  }

  async getLongShortRatio(params: GetLongShortRatioParams): Promise<GetLongShortRatioResponse> {
    return this.request<GetLongShortRatioResponse>("/market/account-ratio", {}, { query: params });
  }

  async getOrderPriceLimit(symbol: SymbolName): Promise<OrderPriceLimit> {
    return this.request<OrderPriceLimit>("/market/price-limit", {}, { query: { symbol } });
  }

  async getRiskLimit(params: GetRiskLimitParams = {}): Promise<GetRiskLimitResponse> {
    return this.request<GetRiskLimitResponse>("/market/risk-limit", {}, { query: params });
  }

  async getMarketStats(symbol: SymbolName): Promise<{
    turnover_24h: number;
    price_change_24h: number;
    high_24h: number;
    low_24h: number;
  }> {
    const response = await this.getTickers({ symbol });
    const ticker = response.list[0];
    if (!ticker) {
      return { turnover_24h: 0, price_change_24h: 0, high_24h: 0, low_24h: 0 };
    }
    const lastPrice = Number(ticker.last_price) || 0;
    const prevPrice = Number(ticker.prev_price_24h) || 0;
    const priceChange = prevPrice !== 0 ? ((lastPrice - prevPrice) / prevPrice) * 100 : 0;
    return {
      turnover_24h: Number(ticker.turnover_24h) || 0,
      price_change_24h: priceChange,
      high_24h: Number(ticker.high_price_24h) || 0,
      low_24h: Number(ticker.low_price_24h) || 0,
    };
  }
}
