export type SymbolName = string;
export type OrderId = string;
export type OrderLinkId = string;
export type UserId = string;
export type ExecutionId = string;
export type DepositId = string;
export type WithdrawId = string;

export type Side = "Sell" | "Buy";
export type OrderType = "Limit" | "Market";

export type OrderStatus =
  | "New"
  | "PartiallyFilled"
  | "Untriggered"
  | "Rejected"
  | "PartiallyFilledCanceled"
  | "Filled"
  | "Canceled"
  | "Triggered"
  | "Deactivated"
  | "Expired";

export type MarginMode = "Cross" | "Isolated";
export type PositionStatus = "Normal" | "Liq" | "Adl";
export type AdlRankIndicator = "Zero" | "One" | "Two" | "Three" | "Four" | "Five";
export type TriggerBy = "LastPrice" | "IndexPrice" | "MarkPrice";
export type TriggerDirection = "Up" | "Down";
export type TpSlMode = "Full" | "Partial";
export type Interval = "1m" | "5m" | "15m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d" | "3d" | "1w" | "1M";
export type IntervalTime = string;
export type Timeframe = string;
export type OrderFilter = string;
export type SmpType = "CancelMaker" | "CancelTaker" | "CancelBoth";
export type TransferDirection = "FundingToTrading" | "TradingToFunding";

export type ExecType =
  | "Trade"
  | "AdlTrade"
  | "Funding"
  | "BustTrade"
  | "Delivery"
  | "Settle"
  | "BlockTrade"
  | "MovePosition"
  | "FutureSpread";

export type CancelType =
  | "CancelByUser"
  | "CancelByAdmin"
  | "CancelBySystem"
  | "CancelByReduceOnly"
  | "CancelByPrepareLiq"
  | "CancelAllBeforeLiq"
  | "CancelByPrepareAdl"
  | "CancelAllBeforeAdl"
  | "CancelBySettle"
  | "CancelByTpSlTsClear"
  | "CancelBySmp"
  | "CancelByDcp"
  | "CancelByRebalance"
  | "CancelByOcoTpCanceledBySlTriggered"
  | "CancelByOcoSlCanceledByTpTriggered";

export type CreateType =
  | "CreateByUser"
  | "CreateByFutureSpread"
  | "CreateByAdminClosing"
  | "CreateBySettle"
  | "CreateByStopOrder"
  | "CreateByTakeProfit"
  | "CreateByPartialTakeProfit"
  | "CreateByStopLoss"
  | "CreateByPartialStopLoss"
  | "CreateByTrailingStop"
  | "CreateByTrailingProfit"
  | "CreateByLiq"
  | "CreateByTakeOverPassThrough"
  | "CreateByAdlPassThrough"
  | "CreateByBlockPassThrough"
  | "CreateByBlockTradeMovePositionPassThrough"
  | "CreateByClosing"
  | "CreateByFGridBot"
  | "CloseByFGridBot"
  | "CreateByTWAP"
  | "CreateByTVSignal"
  | "CreateByMmRateClose"
  | "CreateByMartingaleBot"
  | "CloseByMartingaleBot"
  | "CreateByIceBerg"
  | "CreateByArbitrage"
  | "CreateByDdh"
  | "CreateByBboOrder";

export type StopOrderType =
  | "TakeProfit"
  | "StopLoss"
  | "TrailingStop"
  | "Stop"
  | "PartialTakeProfit"
  | "PartialStopLoss"
  | "TpslOrder"
  | "OcoOrder"
  | "MmRateClose"
  | "BidirectionalTpslOrder";

export type RejectReason =
  | "EcNoError"
  | "EcOthers"
  | "EcUnknownMessageType"
  | "EcMissingClOrdId"
  | "EcMissingOrigClOrdId"
  | "EcClOrdIdOrigClOrdIdAreTheSame"
  | "EcDuplicatedClOrdId"
  | "EcOrigClOrdIdDoesNotExist"
  | "EcTooLateToCancel"
  | "EcUnknownOrderType"
  | "EcUnknownSide"
  | "EcUnknownTimeInForce"
  | "EcWronglyRouted"
  | "EcMarketOrderPriceIsNotZero"
  | "EcLimitOrderInvalidPrice"
  | "EcNoEnoughQtyToFill"
  | "EcNoImmediateQtyToFill"
  | "EcPerCancelRequest"
  | "EcMarketOrderCannotBePostOnly"
  | "EcPostOnlyWillTakeLiquidity"
  | "EcCancelReplaceOrder"
  | "EcInvalidSymbolStatus"
  | "EcCancelForNoFullFill"
  | "EcBySelfMatch"
  | "EcInCallAuctionStatus"
  | "EcQtyCannotBeZero"
  | "EcMarketOrderNoSupportTif"
  | "EcReachMaxTradeNum"
  | "EcInvalidPriceScale"
  | "EcBitIndexInvalid"
  | "EcStopBySelfMatch"
  | "EcInvalidSmpType"
  | "EcCancelByMmp"
  | "EcInvalidUserType"
  | "EcInvalidMirrorOid"
  | "EcInvalidMirrorUid"
  | "EcEcInvalidQty"
  | "EcInvalidAmount"
  | "EcLoadOrderCancel"
  | "EcMarketQuoteNoSuppSell"
  | "EcDisorderOrderId"
  | "EcInvalidBaseValue"
  | "EcLoadOrderCanMatch"
  | "EcSecurityStatusFail"
  | "EcReachRiskPriceLimit"
  | "EcOrderNotExist"
  | "EcCancelByOrderValueZero"
  | "EcCancelByMatchValueZero"
  | "EcReachMarketPriceLimit";

export type TimeInForce = "GTC" | "IOC" | "FOK" | { GTD: number } | "Day";

export interface SlippageToleranceTickSize {
  tick_size: number;
}

export interface SlippageTolerancePercent {
  percent: number;
}

export type SlippageTolerance = SlippageToleranceTickSize | SlippageTolerancePercent;

export interface TpSlSpecMarket {
  market: {
    trigger_price: string;
    trigger_by: TriggerBy;
  };
}

export interface TpSlSpecLimit {
  limit: {
    trigger_price: string;
    limit_price: string;
    trigger_by: TriggerBy;
  };
}

export type TpSlSpec = TpSlSpecMarket | TpSlSpecLimit;

export interface TpSl {
  mode: TpSlMode;
  take_profit?: TpSlSpec | null;
  stop_loss?: TpSlSpec | null;
}

export interface ConditionalOrder {
  trigger_price: string;
  trigger_direction: TriggerDirection;
  trigger_by: TriggerBy;
}

export interface ExitMessageError {
  Error: {
    code: number;
    msg: string;
  };
}

export interface ExitMessageSuccess {
  Success: {
    code: number;
    msg: string;
  };
}

export type ExitMessage = ExitMessageError | ExitMessageSuccess;

export interface AuthorizeRequest {
  signature: string;
  public_key: string;
  timestamp_ms: number;
  nonce: string;
  full_message?: string | null;
}

export interface AuthorizeResponse {
  token: string;
  user_id: string;
}

export interface AccountBalance {
  user_id: UserId;
  user_addr: string;
  vault_addr: string;
  equity: string;
  wallet_balance: string;
  margin_balance: string;
  available_balance: string;
  accrued_interest: string;
  total_order_im: string;
  total_position_im: string;
  total_position_mm: string;
  unrealised_pnl: string;
  unrealized_funding: string;
  realised_pnl_cum: string;
}

export interface GetAccountBalanceResponse {
  list: AccountBalance[];
}

export interface Deposit {
  deposit_id: DepositId;
  tx_id: number;
  version: number;
  root_addr: string;
  user_addr: string;
  from_addr: string;
  to_addr: string;
  amount: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface GetDepositRecordsResponse {
  list: Deposit[];
  next_page_cursor: string;
}

export interface GetDepositRecordsParams {
  deposit_id?: DepositId | null;
  tx_id?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  limit?: number | null;
  cursor?: string | null;
}

export interface Withdrawal {
  withdraw_id: WithdrawId;
  tx_id: number;
  version: number;
  root_addr: string;
  user_addr: string;
  from_addr: string;
  to_addr: string;
  amount: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface GetWithdrawalRecordsResponse {
  list: Withdrawal[];
  next_page_cursor: string;
}

export interface GetWithdrawalRecordsParams {
  withdraw_id?: WithdrawId | null;
  tx_id?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  limit?: number | null;
  cursor?: string | null;
}

export interface TickerSnapshot {
  symbol: SymbolName;
  last_price: string;
  index_price: string;
  mark_price: string;
  prev_price_24h: string;
  high_price_24h: string;
  low_price_24h: string;
  prev_price_1h: string;
  volume_24h: string;
  turnover_24h: string;
  open_interest: string;
  open_interest_volume: string;
  funding_rate: string;
  next_funding_time: string;
  best_ask_size: string;
  best_ask_price: string;
  best_bid_size: string;
  best_bid_price: string;
}

export interface GetTickersResponse {
  list: TickerSnapshot[];
}

export interface GetTickersParams {
  symbol?: SymbolName | null;
}

export type OrderBookLevel = [string, string];

export interface OrderBookSnapshot {
  s: SymbolName;
  ts: string;
  b: OrderBookLevel[];
  a: OrderBookLevel[];
  u: number;
  seq: number;
  mts: string;
}

export interface GetOrderBookResponse {
  result: OrderBookSnapshot;
  time: string;
}

export interface GetOrderBookParams {
  symbol: SymbolName;
  limit?: number | null;
}

export interface KlineSnapshot {
  t: string;
  i: Interval;
  o: string;
  h: string;
  l: string;
  c: string;
  T: string;
  v: string;
  n: string;
}

export interface GetKlineResponse {
  symbol: SymbolName;
  list: KlineSnapshot[];
}

export interface GetKlineParams {
  symbol: SymbolName;
  interval: Interval;
  start_time?: string | null;
  end_time?: string | null;
  limit?: number | null;
}

export interface PriceKlineSnapshot {
  t: string;
  o: string;
  h: string;
  l: string;
  c: string;
}

export interface GetPriceKlineResponse {
  symbol: SymbolName;
  list: PriceKlineSnapshot[];
}

export interface GetMarkPriceKlineParams {
  symbol: SymbolName;
  interval: Interval;
  start_time?: string | null;
  end_time?: string | null;
  limit?: number | null;
}

export interface GetIndexPriceKlineParams {
  symbol: SymbolName;
  interval: Interval;
  start_time?: string | null;
  end_time?: string | null;
  limit?: number | null;
}

export interface FundingRateHistory {
  symbol: SymbolName;
  funding_rate: string;
  funding_time: string;
}

export interface GetFundingRateHistoryResponse {
  list: FundingRateHistory[];
}

export interface GetFundingRateHistoryParams {
  symbol: SymbolName;
  start_time?: string | null;
  end_time?: string | null;
  limit?: number | null;
}

export interface OpenInterest {
  open_interest: string;
  timestamp: string;
}

export interface GetOpenInterestResponse {
  symbol: SymbolName;
  list: OpenInterest[];
  next_page_cursor: string;
}

export interface GetOpenInterestParams {
  symbol: SymbolName;
  interval: IntervalTime;
  start_time?: string | null;
  end_time?: string | null;
  limit?: number | null;
  cursor?: string | null;
}

export interface LongShortRatio {
  symbol: SymbolName;
  buy_ratio: string;
  sell_ratio: string;
  timestamp: string;
}

export interface GetLongShortRatioResponse {
  list: LongShortRatio[];
  next_page_cursor: string;
}

export interface GetLongShortRatioParams {
  symbol: SymbolName;
  period: IntervalTime;
  start_time?: string | null;
  end_time?: string | null;
  limit?: number | null;
  cursor?: string | null;
}

export interface OrderPriceLimit {
  symbol: SymbolName;
  buy_limit: string;
  sell_limit: string;
  ts: string;
}

export interface RiskLimit {
  symbol: SymbolName;
  risk_id: number;
  risk_limit_value: string;
  maintenance_margin: string;
  initial_margin: string;
  is_lowest_risk: boolean;
  max_leverage: string;
  mm_duration: string;
}

export interface GetRiskLimitResponse {
  list: RiskLimit[];
  next_page_cursor: string;
}

export interface GetRiskLimitParams {
  symbol?: SymbolName | null;
  cursor?: string | null;
}

export interface Order {
  order_id: OrderId;
  symbol: SymbolName;
  user_id: UserId;
  price: string;
  qty: string;
  side: Side;
  leverage: string;
  margin_mode: MarginMode;
  order_status: OrderStatus;
  avg_price: string;
  leaves_qty: string;
  leaves_value: string;
  cum_exec_qty: string;
  cum_exec_value: string;
  cum_exec_fee: string;
  time_in_force: TimeInForce;
  order_type: OrderType;
  last_price_on_created: string;
  post_only: boolean;
  reduce_only: boolean;
  close_on_trigger: boolean;
  created_time: string;
  updated_time: string;
  order_link_id?: OrderLinkId | null;
  cancel_type?: CancelType | null;
  create_type?: CreateType | null;
  stop_order_type?: StopOrderType | null;
  reject_reason?: RejectReason | null;
  tpsl?: TpSl | null;
  trigger?: ConditionalOrder | null;
  expire_time?: string | null;
  closed_pnl?: string | null;
}

export interface OrderListResponse {
  list: Order[];
  next_page_cursor: string;
}

export interface PlaceOrderRequest {
  symbol: SymbolName;
  leverage: string;
  side: Side;
  order_type: OrderType;
  qty: string;
  price: string;
  margin_mode: MarginMode;
  time_in_force: TimeInForce;
  post_only: boolean;
  reduce_only: boolean;
  close_on_trigger: boolean;
  order_link_id?: OrderLinkId | null;
  expire_time?: string | null;
  tpsl?: TpSl | null;
  trigger?: ConditionalOrder | null;
  slippage_tolerance?: SlippageTolerance | null;
  smp_group?: number | null;
  smp_type?: SmpType | null;
}

export interface PlaceOrderResponse {
  order_id: OrderId;
  order_link_id?: OrderLinkId | null;
}

export interface BatchPlaceOrdersRequest {
  request: PlaceOrderRequest[];
}

export interface BatchPlaceOrdersResponse {
  result: PlaceOrderResponse[];
  exit_info: ExitMessage[];
  time: string;
}

export interface AmendOrderRequest {
  symbol: SymbolName;
  size: number;
  price: number;
  order_id?: OrderId | null;
  order_link_id?: OrderLinkId | null;
  order_iv?: number | null;
  tpsl?: TpSl | null;
  trigger?: ConditionalOrder | null;
}

export interface AmendOrderResponse {
  order_id: OrderId;
  order_link_id?: OrderLinkId | null;
}

export interface BatchAmendOrdersRequest {
  request: AmendOrderRequest[];
}

export interface BatchAmendOrdersResponse {
  result: AmendOrderResponse[];
  exit_info: ExitMessage[];
  time: string;
}

export interface CancelOrderRequest {
  symbol: SymbolName;
  order_id?: OrderId | null;
  order_link_id?: OrderLinkId | null;
}

export interface CancelOrderResponse {
  order_id: OrderId;
  order_link_id?: OrderLinkId | null;
}

export interface BatchCancelOrdersRequest {
  request: CancelOrderRequest[];
}

export interface BatchCancelOrdersResponse {
  result: CancelOrderResponse[];
  exit_info: ExitMessage[];
  time: string;
}

export interface CancelAllOrdersRequest {
  symbol?: SymbolName | null;
}

export interface CancelAllOrdersResponse {
  result: CancelOrderResponse[];
  exit_info: ExitMessage;
  time: string;
}

export interface GetRealtimeOrdersParams {
  symbol?: SymbolName | null;
  order_id?: OrderId | null;
  order_link_id?: OrderLinkId | null;
  open_only: boolean;
  order_filter?: OrderFilter | null;
  limit?: number | null;
  cursor?: string | null;
}

export interface GetOrderHistoryParams {
  symbol?: SymbolName | null;
  order_id?: OrderId | null;
  order_link_id?: OrderLinkId | null;
  order_filter?: OrderFilter | null;
  order_status?: OrderStatus[] | null;
  start_time?: string | null;
  end_time?: string | null;
  limit?: number | null;
  cursor?: string | null;
}

export interface Execution {
  exec_id: ExecutionId;
  symbol: SymbolName;
  order_id: OrderId;
  side: Side;
  user_id: UserId;
  order_price: string;
  order_qty: string;
  leaves_qty: string;
  order_type: OrderType;
  exec_price: string;
  exec_qty: string;
  exec_value: string;
  exec_type: ExecType;
  exec_time: string;
  is_maker: boolean;
  fee_rate: string;
  mark_price: string;
  index_price: string;
  seq: number;
  order_link_id?: OrderLinkId | null;
  closed_size?: string | null;
  create_type?: CreateType | null;
  stop_order_type?: StopOrderType | null;
}

export interface GetTradeHistoryResponse {
  list: Execution[];
  next_page_cursor?: string | null;
}

export interface GetTradeHistoryParams {
  symbol?: SymbolName | null;
  order_id?: OrderId | null;
  order_link_id?: OrderLinkId | null;
  start_time?: string | null;
  end_time?: string | null;
  limit?: number | null;
  cursor?: string | null;
}

export interface Position {
  risk_id: number;
  risk_limit_value: string;
  symbol: SymbolName;
  user_id: UserId;
  side: Side;
  size: string;
  avg_price: string;
  position_value: string;
  margin_mode: MarginMode;
  position_balance: string;
  position_status: PositionStatus;
  leverage: string;
  mark_price: string;
  liq_price: string;
  bust_price: string;
  position_im: string;
  position_im_by_mp: string;
  position_mm: string;
  position_mm_by_mp: string;
  unrealized_pnl: string;
  realized_pnl_cur: string;
  realized_pnl_cum: string;
  adl_rank_indicator: AdlRankIndicator;
  is_reduce_only: boolean;
  created_time: string;
  updated_time: string;
  seq: number;
  take_profit?: string | null;
  stop_loss?: string | null;
  trailing_stop?: string | null;
  leverage_sys_updated_time?: string | null;
  mmr_sys_update_time?: string | null;
}

export interface GetPositionInfoResponse {
  list: Position[];
  next_page_cursor: string;
}

export interface GetPositionInfoParams {
  symbol: SymbolName;
  limit?: number | null;
  cursor?: string | null;
}

export interface ClosedPnl {
  symbol: SymbolName;
  order_id: OrderId;
  side: Side;
  qty: string;
  order_price: string;
  order_type: OrderType;
  exec_type: ExecType;
  closed_size: string;
  cum_entry_value: string;
  avg_entry_price: string;
  cum_exit_value: string;
  avg_exit_price: string;
  closed_pnl: string;
  fill_count: string;
  leverage: string;
  open_fee: string;
  close_fee: string;
  created_time: string;
  updated_time: string;
}

export interface GetClosedPnlResponse {
  list: ClosedPnl[];
  next_page_cursor: string;
}

export interface GetClosedPnlParams {
  symbol?: SymbolName | null;
  start_time?: string | null;
  end_time?: string | null;
  limit?: number | null;
  cursor?: string | null;
}

export interface SetLeverageRequest {
  symbol: SymbolName;
  leverage: string;
}

export interface SetLeverageResponse {
  success: boolean;
  time: string;
}

export interface SetTradingStopRequest {
  symbol: SymbolName;
  tpsl?: TpSl | null;
  trailing_stop?: string | null;
  active_price?: string | null;
  tp_size?: string | null;
  sl_size?: string | null;
}

export interface SetTradingStopResponse {
  success: boolean;
  time: string;
}

export interface GetRootAccountResponse {
  root_addr: string;
}

export interface GetSubAccountsResponse {
  sub_accounts: string[];
}

export interface FundRequest {
  receiver: string;
  metadatas: string[];
  amounts: number[];
  request_id?: string | null;
}

export interface FundResult {
  txid: string;
}

export interface ApiTransferRequest {
  amount: string;
  direction: TransferDirection;
}

export interface ApiTransferResponse {
  success: boolean;
}

export interface ApiWithdrawRequest {
  asset: string;
  amount: string;
}

export interface ApiWithdrawResponse {
  success: boolean;
}

export interface LeaderboardData {
  place: string;
  wallet: string;
  account_value: string;
  volume: string;
  pnl: string;
  roi: string;
}

export interface LeaderboardMeta {
  total: number;
}

export interface LeaderboardResponse {
  data: LeaderboardData[];
  meta: LeaderboardMeta;
}

export interface GetLeaderboardParams {
  timeframe: Timeframe;
}

export interface PaginationParams {
  limit?: number | null;
  cursor?: string | null;
}
