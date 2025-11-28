import { PaginationParams } from "@/types/common";

export interface PositionResponse {
  sid: string;
  size: number;
  price: number;
  margin: number;
  funding_index: number;
  epoch: number;
  market_addr: string;
  user_addr: string;
  seq: number;
  timestamp: number;
  side?: "buy" | "sell";
  entry_price?: number;
  is_cross?: boolean;
  mark_price?: number;
  unrealized_pnl?: number;
  realized_pnl_delta?: number;
  realized_pnl_cum?: number;
  liq_price?: number;
  leverage?: number;
  stop_loss: number;
  take_profit: number;
}

export interface ListPositionsParams extends PaginationParams {
  market_addr?: string;
}
