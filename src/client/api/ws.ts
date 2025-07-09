import { WsClient } from "@/api/ws";
import type { EkidenClientConfig } from "@/config";
import { ChannelMap, OrderbookEventHandler, TradesEventHandler } from "@/types";

export class WsAPIClient {
  ws: WsClient<string, ChannelMap>;

  constructor(readonly config: EkidenClientConfig) {
    if (!config.wsURL) {
      throw new Error("WebSocket URL is not configured");
    }
    this.ws = new WsClient(config.wsURL);
  }

  subscribeOrderbook(marketAddr: string, handler: OrderbookEventHandler) {
    const channel = `orderbook/${marketAddr}` as const;
    this.ws.subscribe(channel, handler);
    return () => this.ws.unsubscribe(channel, handler);
  }

  subscribeTrades(marketAddr: string, handler: TradesEventHandler) {
    const channel = `trades/${marketAddr}` as const;
    this.ws.subscribe(channel, handler);
    return () => this.ws.unsubscribe(channel, handler);
  }

  close() {
    this.ws.close();
  }
}
