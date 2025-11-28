import { PaginationParams } from "@/types/common";

export interface OrderResponse {
  sid: string;
  side: string;
  size: number;
  price: number;
  leverage: number;
  type: string;
  status: string;
  user_addr: string;
  market_addr: string;
  seq: number;
  timestamp: number;
  stop_loss: number;
  take_profit: number;
}

export interface BuildOrderParams {
  side: "buy" | "sell";
  size: string;
  price: string;
  type: "market" | "limit";
}

export interface ListOrdersParams extends PaginationParams {
  market_addr: string;
  side?: string | null;
}

export interface ListUserOrdersParams extends PaginationParams {
  market_addr?: string;
  side?: string | null;
}

export interface FillResponse {
  sid: string;
  side: string;
  size: number;
  price: number;
  maker_fee: number;
  taker_fee: number;
  taker_order_sid: string;
  taker_addr: string;
  maker_order_sid: string;
  maker_addr: string;
  market_addr: string;
  seq: number;
  maker_leverage: number;
  taker_leverage: number;
  maker_is_cross: boolean;
  taker_is_cross: boolean;
  timestamp: number;
  timestamp_ms: number;
}

export interface ListFillsParams extends PaginationParams {
  market_addr: string;
}

export interface ListUserFillsParams extends PaginationParams {
  market_addr?: string;
}

export type TpSlMode = "FULL" | "PARTIAL";

export type TpSlOrderType = "MARKET" | "LIMIT";

export interface TpSlSpec {
  trigger_price: number;
  order_type: TpSlOrderType;
  limit_price?: number;
}

export interface TpSlBracket {
  mode: TpSlMode;
  take_profit?: TpSlSpec | null;
  stop_loss?: TpSlSpec | null;
}

export interface OrderCreate {
  market_addr: string;
  price: number;
  side: string;
  size: number;
  type: string;
  leverage: number;
  is_cross: boolean;
  time_in_force: string | undefined;
  trigger_price?: number;
  reduce_only?: boolean;
  order_link_id?: string;
  bracket?: TpSlBracket;
}

export interface OrderCancel {
  sid: string;
}

export interface SendIntentParams {
  nonce: number;
  payload: ActionPayload;
  signature: string;
  user_addr?: string;
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
  | OrderCancelAllAction
  | LeverageAssignAction;

export interface OrderCreateAction {
  type: "order_create";
  orders: OrderCreate[];
}

export interface OrderCancelAction {
  type: "order_cancel";
  cancels: OrderCancel[];
}

export interface OrderCancelAllAction {
  type: "order_cancel_all";
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
