import ReconnectingWebSocket from "reconnecting-websocket";

import {
  OrderbookChannel,
  OrderbookEventHandler,
  OrderbookSubscribeRequest,
  OrderbookUnsubscribeRequest,
  OrderbookWsMessage,
} from "@/types";

export class OrderbookWsClient {
  private ws: ReconnectingWebSocket;
  private handlers: Map<OrderbookChannel, Set<OrderbookEventHandler>> =
    new Map();

  constructor(private url: string) {
    this.ws = new ReconnectingWebSocket(url);
    this.ws.addEventListener("message", (event) => this.handleMessage(event));
  }

  subscribe(channel: OrderbookChannel, handler: OrderbookEventHandler) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      this.send({ method: "subscribe", channel });
    }

    this.handlers.get(channel)!.add(handler);
  }

  unsubscribe(channel: OrderbookChannel, handler: OrderbookEventHandler) {
    const set = this.handlers.get(channel);
    if (!set) return;

    set.delete(handler);

    if (set.size === 0) {
      this.send({ method: "unsubscribe", channel });
      this.handlers.delete(channel);
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const msg: OrderbookWsMessage = JSON.parse(event.data);

      if (msg.type === "event" && this.handlers.has(msg.channel)) {
        this.handlers.get(msg.channel)!.forEach((h) => h(msg));
      }
    } catch (err) {
      console.warn("[OrderbookWsClient] Failed to parse message", err);
    }
  }

  private send(msg: OrderbookSubscribeRequest | OrderbookUnsubscribeRequest) {
    this.ws.send(JSON.stringify(msg));
  }

  close() {
    this.ws.close();
  }
}
