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
