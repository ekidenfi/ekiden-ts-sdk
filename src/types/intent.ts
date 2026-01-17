export interface SendIntentParams {
	nonce: number;
	payload: ActionPayload;
	signature: string;
	sub_account_address?: string;
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

export type IntentTpSlMode = "FULL" | "PARTIAL";

export type IntentTpSlOrderType = "MARKET" | "LIMIT";

export interface IntentTpSlSpec {
	trigger_price: number;
	order_type: IntentTpSlOrderType;
	limit_price?: number;
}

export interface TpSlBracket {
	mode: IntentTpSlMode;
	take_profit?: IntentTpSlSpec | null;
	stop_loss?: IntentTpSlSpec | null;
}

export interface OrderCancelAction {
	type: "order_cancel";
	cancels: OrderCancel[];
}

export interface OrderCancel {
	sid: string;
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
