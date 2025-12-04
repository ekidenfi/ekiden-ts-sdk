import type {
  CandleResponse,
  GetMarketInfoParams,
  ListCandlesParams,
  MarketResponse,
  MarketStatsResponse,
} from "./types";

import { BaseHttpClient } from "@/core/base";

/**
 * Client for market data operations
 */
export class MarketClient extends BaseHttpClient {
  /**
   * Get all available markets
   * @returns List of all markets with their configuration
   * @example
   * ```typescript
   * const markets = await client.market.getMarkets();
   * ```
   */
  async getMarkets(): Promise<MarketResponse[]> {
    return this.request<MarketResponse[]>("/market/market_info");
  }

  /**
   * Get market information with optional filters
   * @param params - Filter parameters (market address, symbol, pagination)
   * @returns Filtered list of markets
   * @example
   * ```typescript
   * const btcMarket = await client.market.getMarketInfo({ symbol: "BTC-WUSDC" });
   * ```
   */
  async getMarketInfo(params: GetMarketInfoParams = {}): Promise<MarketResponse[]> {
    return this.request<MarketResponse[]>("/market/market_info", {}, { query: params });
  }

  /**
   * Get OHLCV candles for a market
   * @param params - Candle query parameters (market, timeframe, time range)
   * @returns Array of candle data
   * @example
   * ```typescript
   * const candles = await client.market.getCandles({
   *   market_addr: "0x...",
   *   timeframe: "1h",
   *   start_time: Date.now() - 86400000,
   * });
   * ```
   */
  async getCandles(params: ListCandlesParams): Promise<CandleResponse[]> {
    return this.request<CandleResponse[]>("/market/candles", {}, { query: params });
  }

  /**
   * Get 24h market statistics
   * @param marketAddr - Market address
   * @returns Market statistics including volume, price changes, etc.
   * @example
   * ```typescript
   * const stats = await client.market.getMarketStats("0x...");
   * console.log(stats.volume_24h, stats.price_change_24h);
   * ```
   */
  async getMarketStats(marketAddr: string): Promise<MarketStatsResponse> {
    return this.request<MarketStatsResponse>(`/market/candles/stats/${marketAddr}`);
  }
}
