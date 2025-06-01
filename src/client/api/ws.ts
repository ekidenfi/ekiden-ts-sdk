import { OrderbookWsClient, TradesWsClient } from "@/api/ws";
import type { EkidenClientConfig } from "@/config";

export class WsAPIClient {
  orderbook: OrderbookWsClient;
  trades: TradesWsClient;

  constructor(readonly config: EkidenClientConfig) {
    if (!config.wsURL) {
      throw new Error("WebSocket URL is not configured");
    }
    this.orderbook = new OrderbookWsClient(config.wsURL);
    this.trades = new TradesWsClient(config.wsURL);
  }

  subscribeOrderbook(
    marketAddr: string,
    handler: Parameters<OrderbookWsClient["subscribe"]>[1],
  ) {
    this.orderbook.subscribe(`orderbook/${marketAddr}`, handler);
    return () => this.orderbook.unsubscribe(`orderbook/${marketAddr}`, handler);
  }

  subscribeTrades(
    marketAddr: string,
    handler: Parameters<TradesWsClient["subscribe"]>[1],
  ) {
    this.trades.subscribe(`trades/${marketAddr}`, handler);
    return () => this.trades.unsubscribe(`trades/${marketAddr}`, handler);
  }

  close() {
    this.orderbook.close();
    this.trades.close();
  }
}
