export type PriceLevel = [price: string, size: string];

export type OrderbookSnapshot = {
  s: string; // symbol
  ts: number; // timestamp
  b: PriceLevel[]; // bids
  a: PriceLevel[]; // asks
  u: number; // update_id
  seq: number;
  mts: number; // matching_ts
};

export type OrderbookDelta = {
  s: string; // symbol
  ts: number; // timestamp
  b: PriceLevel[]; // bids
  a: PriceLevel[]; // asks
  u: number; // update_id
  seq: number;
  mts: number; // matching_ts
};

export type OrderbookEvent = OrderbookSnapshot | OrderbookDelta;

export type OrderbookChannel = `orderbook.${string}.${string}`;

export type OrderbookEventMessage = {
  op: "event";
  topic: OrderbookChannel;
  type: "snapshot" | "delta";
  data: OrderbookEvent;
};

export type OrderbookEventHandler = (event: OrderbookEventMessage) => void;

export type TradesChannel = `trade.${string}`;

export type Trade = {
  i: string; // trade_id
  s: string; // symbol
  S: "Buy" | "Sell"; // side
  v: string; // size
  p: string; // price
  T: number; // trade_time
  seq: number;
};

export type TradesEventData = Trade[];

export type TradesEventMessage = {
  op: "event";
  topic: TradesChannel;
  data: TradesEventData;
};

export type TradesEventHandler = (event: TradesEventMessage) => void;

export type TickerChannel = `ticker.${string}`;

export type WSTickerSnapshot = {
  symbol: string;
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
  next_funding_time: number;
  best_ask_size: string;
  best_ask_price: string;
  best_bid_size: string;
  best_bid_price: string;
};

export type TickerEventMessage = {
  op: "event";
  topic: TickerChannel;
  data: WSTickerSnapshot;
};

export type TickerEventHandler = (event: TickerEventMessage) => void;

export type KlineChannel = `kline.${string}.${string}`;

export type WSKlineSnapshot = {
  t: number; // open_time
  i: string; // interval
  o: string; // open
  h: string; // high
  l: string; // low
  c: string; // close
  T: number; // close_time
  v: string; // volume
  n: string; // count
};

export type KlineEventMessage = {
  op: "event";
  topic: KlineChannel;
  data: WSKlineSnapshot;
};

export type KlineEventHandler = (event: KlineEventMessage) => void;

export type OrderChannel = "order";
export type PositionChannel = "position";
export type ExecutionChannel = "execution";
export type AccountBalanceChannel = "account_balance";

export type OrderEventMessage = {
  op: "event";
  topic: OrderChannel;
  data: OrderResponse[];
};

export type PositionEventMessage = {
  op: "event";
  topic: PositionChannel;
  data: PositionResponse[];
};

export type ExecutionEventMessage = {
  op: "event";
  topic: ExecutionChannel;
  data: FillResponse[];
};

export type AccountBalanceEventMessage = {
  op: "event";
  topic: AccountBalanceChannel;
  data: {
    user_id: string;
    total_equity: string;
    available_balance: string;
    position_margin: string;
    order_margin: string;
    unrealized_pnl: string;
  };
};

export type ChannelMap = {
  [key: OrderbookChannel]: OrderbookEventMessage;
  [key: TradesChannel]: TradesEventMessage;
  [key: TickerChannel]: TickerEventMessage;
  [key: KlineChannel]: KlineEventMessage;
  [key: OrderChannel]: OrderEventMessage;
  [key: PositionChannel]: PositionEventMessage;
  [key: ExecutionChannel]: ExecutionEventMessage;
  [key: AccountBalanceChannel]: AccountBalanceEventMessage;
};

export interface OrderResponse {
  order_id: string;
  symbol: string;
  side: "Buy" | "Sell";
  order_type: string;
  price: string;
  qty: string;
  order_status: string;
  leverage: string;
  created_time: string;
  updated_time: string;
  user_id: string;
  tpsl?: any;
}

export interface FillResponse {
  exec_id: string;
  symbol: string;
  order_id: string;
  side: "Buy" | "Sell";
  exec_price: string;
  exec_qty: string;
  exec_time: string;
  fee_rate: string;
  user_id: string;
  seq?: number;
}

export interface PositionResponse {
  symbol: string;
  user_id: string;
  side: "Buy" | "Sell";
  size: string;
  avg_price: string;
  position_value: string;
  margin_mode: string;
  position_balance: string;
  position_status: string;
  leverage: string;
  mark_price: string;
  liq_price: string;
  unrealized_pnl: string;
  realized_pnl_cum: string;
  created_time: string;
  updated_time: string;
  seq?: number;
  take_profit?: string | null;
  stop_loss?: string | null;
}
