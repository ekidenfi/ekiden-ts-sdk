import type { PaginationParams } from "@/types/common";

export interface VaultResponse {
  addr: string;
  amount: number;
  asset_addr: string;
  user_addr: string;
  created_at: string;
  updated_at: string;
}

export interface ListVaultsParams extends PaginationParams {}

export interface WithdrawFromTradingParams {
  addr_from: string;
  addr_to: string;
  amount: number;
  asset_metadata: string;
  nonce: number;
  signature: string;
  timestamp: number;
  withdraw_available: boolean;
}

export interface WithdrawFromTradingResponse {
  success: boolean;
  message?: string;
}
