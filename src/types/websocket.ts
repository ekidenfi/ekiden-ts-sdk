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
  op: "event";
  topic: OrderbookChannel;
  data: OrderbookEvent;
};

export type OrderbookEventHandler = (event: OrderbookEventMessage) => void;

export type TradesChannel = `trade/${string}`;

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
  op: "event";
  topic: TradesChannel;
  data: TradesEventData;
};

export type TradesEventHandler = (event: TradesEventMessage) => void;

export type TickerChannel = `ticker/${string}`;

export type TickerSnapshot = {
  type: "ticker";
  symbol: string;
  market_addr: string;
  ts: number;
  last_price: number;
  mark_price: number;
  index_price: number;
  open_interest: number;
  open_interest_value: number;
  funding_rate: number;
  funding_rate_percentage: number;
  next_funding_time: number;
  volume_24h: number;
  turnover_24h: number;
};

export type TickerEventMessage = {
  op: "event";
  topic: TickerChannel;
  data: TickerSnapshot;
};

export type TickerEventHandler = (event: TickerEventMessage) => void;

export type ChannelMap = {
  [key: OrderbookChannel]: OrderbookEventMessage;
  [key: TradesChannel]: TradesEventMessage;
  [key: TickerChannel]: TickerEventMessage;
};
