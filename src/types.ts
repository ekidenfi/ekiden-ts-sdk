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
  seq: number;
  timestamp: number;
}

export interface BuildOrderParams {
  side: "buy" | "sell";
  size: string;
  price: string;
  type: "market" | "limit";
}

export interface MarketShort {
  address: string;
  quote_decimals: number;
  base_decimals: number;
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
  seq: number;
  timestamp: number;
}

export interface PositionResponse {
  sid: string;
  size: number;
  price: number;
  margin: number;
  funding_index: number;
  epoch: number;
  seq: number;
  timestamp: number;
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

export interface GetFundingRateParams {
  /** Market address to get funding rate for */
  market_addr?: string;
  /** Symbol to get funding rate for (alternative to market_addr) */
  symbol?: string;
}

export interface FundingRateResponse {
  /** Market address */
  market_addr: string;
  /** Market symbol */
  symbol: string;
  /** Current funding rate as a percentage (e.g., 0.01 = 1%) */
  funding_rate_percentage: number;
  /** Funding rate in raw format (scaled) */
  funding_rate_raw: number;
  /** Current mark price */
  mark_price: number;
  /** Current oracle price */
  oracle_price: number;
  /** Premium rate (mark - oracle) / oracle */
  premium_rate_percentage: number;
  /** Next funding time (ISO string) */
  next_funding_time: string;
  /** Funding interval in seconds */
  funding_interval_seconds: number;
  /** Time until next funding in seconds */
  time_to_next_funding_seconds: number;
  /** Current funding index */
  funding_index: number;
  /** Last updated timestamp (ISO string) */
  last_updated: string;
}

export interface FundingHistoryResponse {
  /** Market address */
  market_addr: string;
  /** Historical funding rates */
  funding_rates: FundingRateHistoryEntry[];
}

export interface FundingRateHistoryEntry {
  /** Funding rate as percentage */
  funding_rate_percentage: number;
  /** Funding rate raw value */
  funding_rate_raw: number;
  /** Mark price at the time */
  mark_price: number;
  /** Oracle price at the time */
  oracle_price: number;
  /** Timestamp when this rate was applied (ISO string) */
  timestamp: string;
  /** Funding index at this time */
  funding_index: number;
}

export interface FundingEpochResponse {
  /** Current funding epoch timestamp */
  current_funding_epoch: number;
  /** Funding interval in seconds */
  funding_interval_seconds: number;
  /** Formatted timestamp */
  timestamp: string;
}

export interface ListCandlesParams extends PaginationParams {
  /** Market address */
  market_addr: string;
  /** Timeframe (e.g., "1m", "5m", "1h", "1d") */
  timeframe: string;
  /** Start time as Unix timestamp */
  start_time?: number;
  /** End time as Unix timestamp */
  end_time?: number;
}

export interface CandleResponse {
  /** Unix timestamp for the candle open time */
  timestamp: number;
  /** Opening price */
  open: number;
  /** Highest price in the period */
  high: number;
  /** Lowest price in the period */
  low: number;
  /** Closing price */
  close: number;
  /** Total volume traded in the period */
  volume: number;
  /** Number of trades in the period */
  count: number;
}

export interface MarketStatsResponse {
  /** Market address */
  market_addr: string;
  /** Current price */
  current_price?: number;
  /** Price 24 hours ago */
  price_24h_ago?: number;
  /** Price change percentage in 24h */
  price_change_24h?: number;
  /** Highest price in 24h */
  high_24h?: number;
  /** Lowest price in 24h */
  low_24h?: number;
  /** Volume traded in 24h */
  volume_24h: number;
  /** Number of trades in 24h */
  trades_24h: number;
}

export interface PortfolioResponse {
  /** User's address */
  user_addr: string;
  /** List of all user's positions */
  positions: PortfolioPosition[];
  /** List of all user's vault balances */
  vault_balances: PortfolioVault[];
  /** Portfolio summary */
  summary: PortfolioSummary;
}

export interface PortfolioPosition {
  /** Position ID */
  sid: string;
  /** Market address */
  market_addr: string;
  /** Position size (positive for long, negative for short) */
  size: number;
  /** Average entry price */
  price: number;
  /** Margin allocated to this position */
  margin: number;
  /** Funding index */
  funding_index: number;
  /** Position epoch */
  epoch: number;
  /** Sequence number */
  seq: number;
  /** Position timestamp */
  timestamp: number;
}

export interface PortfolioVault {
  /** Vault ID */
  id: number;
  /** Asset address */
  asset_addr: string;
  /** Current balance */
  balance: number;
}

export interface PortfolioSummary {
  /** Total number of open positions */
  total_positions: number;
  /** Total number of vaults */
  total_vaults: number;
  /** Total balance (estimated in USD) */
  total_balance: number;
  /** Total margin used across all positions */
  total_margin_used: number;
  /** Total available balance across all vaults */
  total_available_balance: number;
}

export interface UserLeverageParams {
  market_addr: string;
  leverage: number;
}

export interface SendIntentParams {
  nonce: number;
  payload: ActionPayload;
  signature: string;
}

export interface SendIntentResponse {
  output: IntentOutput;
  seq: number;
  version: number;
  timestamp: number;
}

export interface SendIntentWithCommitResponse {
  output: IntentOutput;
  sid: string;
  status: number;
  seq: number;
  version: number;
  timestamp: number;
  error_message: string;
}

export type ActionPayload =
  | OrderCreateAction
  | OrderCancelAction
  | LeverageAssignAction;

export interface OrderCreateAction {
  type: "order_create";
  orders: OrderCreate[];
}

export interface OrderCreate {
  market_addr: string;
  price: number;
  side: string;
  size: number;
  type: string;
  leverage: number;
  is_cross: boolean;
}

export interface OrderCancelAction {
  type: "order_cancel";
  cancels: OrderCancel[];
}

export interface OrderCancel {
  sid: string;
}

export interface LeverageAssignAction {
  type: "leverage_assign";
  leverage: number;
  market_addr: string;
}

export type IntentOutput =
  | OrderCreateIntentOutput
  | OrderCancelIntentOutput
  | LeverageAssignIntentOutput;

export interface OrderCreateIntentOutput {
  type: "order_create";
  outputs: OrderCreateOutput[];
}

export interface OrderCreateOutput {
  sid: string;
}

export interface OrderCancelIntentOutput {
  type: "order_cancel";
  outputs: OrderCancelOutput[];
}

export interface OrderCancelOutput {
  success: boolean;
}

export interface LeverageAssignIntentOutput {
  type: "leverage_assign";
  success: boolean;
}

// Exported types for WebSocket API

export type PriceLevel = [price: number, size: number];

export type OrderbookSnapshot = {
  type: "orderbook_snapshot";
  asks: PriceLevel[];
  bids: PriceLevel[];
  market_addr: string;
  seq: number;
  matched_at: number;
};

export type OrderbookDelta = {
  type: "orderbook_delta";
  asks: PriceLevel[];
  bids: PriceLevel[];
  seq: number;
  matched_at: number;
};

export type OrderbookEvent = OrderbookSnapshot | OrderbookDelta;

export type OrderbookChannel = `orderbook/${string}`;

export type OrderbookEventMessage = {
  type: "event";
  channel: OrderbookChannel;
  data: OrderbookEvent;
};

export type OrderbookEventHandler = (event: OrderbookEventMessage) => void;

// --- WebSocket: trades channel types ---

export type TradesChannel = `trades/${string}`;

export type Trade = {
  price: number;
  size: number;
  side: "buy" | "sell";
  timestamp: number;
};

export type TradesEventData = {
  type: "trades";
  trades: Trade[];
  market_addr: string;
  seq: number;
};

export type TradesEventMessage = {
  type: "event";
  channel: TradesChannel;
  data: TradesEventData;
};

export type TradesEventHandler = (event: TradesEventMessage) => void;

export type ChannelMap = {
  [key: OrderbookChannel]: OrderbookEventMessage;
  [key: TradesChannel]: TradesEventMessage;
};
