export interface GetFundingRateParams {
  market_addr?: string;
  symbol?: string;
}

export interface FundingRateResponse {
  market_addr: string;
  symbol: string;
  funding_rate_percentage: number;
  funding_rate_raw: number;
  mark_price: number;
  oracle_price: number;
  premium_rate_percentage: number;
  next_funding_time: string;
  funding_interval_seconds: number;
  time_to_next_funding_seconds: number;
  funding_index: number;
  last_updated: string;
}

export interface FundingHistoryResponse {
  market_addr: string;
  funding_rates: FundingRateHistoryEntry[];
}

export interface FundingRateHistoryEntry {
  funding_rate_percentage: number;
  funding_rate_raw: number;
  mark_price: number;
  oracle_price: number;
  timestamp: string;
  funding_index: number;
}

export interface FundingEpochResponse {
  current_funding_epoch: number;
  funding_interval_seconds: number;
  timestamp: string;
}
