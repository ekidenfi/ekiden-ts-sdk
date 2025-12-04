import type { PaginationParams } from "@/types/common";

export interface LeaderboardDataResponse {
  place: number;
  wallet: string;
  account_value: number;
  volume: number;
  pnl: number;
  roi: number;
}

export interface LeaderboardParams extends PaginationParams {
  time_frame: string;
  sort_by?: string;
}

export interface UserLeaderboardParams {
  time_frame: string;
}
