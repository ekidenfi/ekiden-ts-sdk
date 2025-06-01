import { OrderbookWsClient } from "@/api/ws";
import type { EkidenClientConfig } from "@/config";

export class WsAPIClient {
  ws: OrderbookWsClient;

  constructor(readonly config: EkidenClientConfig) {
    if (!config.wsURL) {
      throw new Error("WebSocket URL is not configured");
    }

    this.ws = new OrderbookWsClient(config.wsURL);
  }

  subscribeOrderbook(
    marketAddr: string,
    handler: Parameters<OrderbookWsClient["subscribe"]>[1],
  ) {
    this.ws.subscribe(`orderbook/${marketAddr}`, handler);
  }

  unsubscribeOrderbook(
    marketAddr: string,
    handler: Parameters<OrderbookWsClient["unsubscribe"]>[1],
  ) {
    this.ws.unsubscribe(`orderbook/${marketAddr}`, handler);
  }

  close() {
    this.ws.close();
  }
}
