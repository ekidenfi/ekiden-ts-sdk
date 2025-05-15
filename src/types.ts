export interface AuthorizeParams {
  signature: string;
  public_key: string;
}

export interface AuthorizeResponse {
  token: string;
}

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
  mark_price: number;
  oracle_price: number;
  open_interest: number;
  funding_index: number;
  funding_epoch: number;
  root: string;
  epoch: number;
  created_at: string;
  updated_at: string;
}

export interface OrderResponse {
  sid: string;
  side: string;
  size: number;
  price: number;
  type: string;
  status: string;
  user_addr: string;
  market_addr: string;
  nonce: number;
  signature: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderParams {
  market_addr: string;
  side: string;
  size: number;
  price: number;
  type: string;
  nonce: number;
  signature: string;
}

export interface CreateOrderResponse {
  sid: string;
}

export interface FillResponse {
  sid: string;
  side: string;
  size: number;
  price: number;
  value: number;
  fee: number;
  taker_order_sid: string;
  taker_addr: string;
  maker_order_sid: string;
  maker_addr: string;
  market_addr: string;
  created_at: string;
  updated_at: string;
}

export interface PositionResponse {
  sid: string;
  size: number;
  price: number;
  margin: number;
  funding_index: number;
  epoch: number;
  created_at: string;
  updated_at: string;
}

export interface VaultResponse {
  addr: string;
  amount: number;
  asset_addr: string;
  user_addr: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface ListOrdersParams extends PaginationParams {
  market_addr: string;
  side?: string;
}

export interface ListFillsParams extends PaginationParams {
  market_addr: string;
}

export interface ListPositionsParams extends PaginationParams {
  market_addr?: string;
}

export interface ListVaultsParams extends PaginationParams {}
