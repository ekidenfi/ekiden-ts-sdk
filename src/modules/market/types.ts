import type { PaginationParams } from "@/types/common";

export interface MarketResponse {
  symbol: string;
  base_addr: string;
  base_decimals: number;
  quote_addr: string;
  quote_decimals: number;
  min_order_size: number;
  max_leverage: number;
  initial_margin_ratio: number;
  maintenance_margin_ratio: number;
  last_price?: number;
  mark_price: number;
  oracle_price: number;
  open_interest: number;
  funding_index: number;
  funding_epoch: number;
  root: string;
  epoch: number;
  created_at: string;
  updated_at: string;
  addr?: string;
  price_feed_id?: string;
  max_leverage_isolated?: number;
  initial_margin_ratio_isolated?: number;
  maintenance_margin_ratio_isolated?: number;
  isolated_margin_enabled?: boolean;
  maker_fee_rate?: number;
  taker_fee_rate?: number;
}

export interface GetMarketInfoParams {
  market_addr?: string;
  symbol?: string;
  page?: number;
  per_page?: number;
}

export interface MarketShort {
  address: string;
  quote_decimals: number;
  base_decimals: number;
}

export interface ListCandlesParams extends PaginationParams {
  market_addr: string;
  timeframe: string;
  start_time?: number;
  end_time?: number;
}

export interface CandleResponse {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  count: number;
}

export interface MarketStatsResponse {
  market_addr: string;
  current_price?: number;
  price_24h_ago?: number;
  price_change_24h?: number;
  high_24h?: number;
  low_24h?: number;
  volume_24h: number;
  trades_24h: number;
  turnover_24h: number;
}
