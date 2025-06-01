import ReconnectingWebSocket from "reconnecting-websocket";

import {
  OrderbookChannel,
  OrderbookEventHandler,
  OrderbookSubscribeRequest,
  OrderbookUnsubscribeRequest,
  TradesChannel,
  TradesEventHandler,
  TradesSubscribeRequest,
  TradesUnsubscribeRequest,
} from "@/types";

class BaseChannelWsClient<
  Channel extends string,
  EventHandler extends (event: any) => void,
  SubscribeReq,
  UnsubscribeReq,
> {
  private ws: ReconnectingWebSocket;
  private handlers: Map<Channel, Set<EventHandler>> = new Map();

  constructor(private url: string) {
    this.ws = new ReconnectingWebSocket(url);
    this.ws.addEventListener("message", (event) => this.handleMessage(event));
  }

  subscribe(channel: Channel, handler: EventHandler) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      this.send({ method: "subscribe", channel } as SubscribeReq);
    }
    this.handlers.get(channel)!.add(handler);
  }

  unsubscribe(channel: Channel, handler: EventHandler) {
    const set = this.handlers.get(channel);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
      this.send({ method: "unsubscribe", channel } as UnsubscribeReq);
      this.handlers.delete(channel);
    }
  }

  protected handleMessage(event: MessageEvent) {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "event" && this.handlers.has(msg.channel)) {
        this.handlers.get(msg.channel)!.forEach((h) => h(msg));
      }
    } catch (err) {
      console.warn(`[${this.constructor.name}] Failed to parse message`, err);
    }
  }

  private send(msg: SubscribeReq | UnsubscribeReq) {
    this.ws.send(JSON.stringify(msg));
  }

  close() {
    this.ws.close();
  }
}

export class OrderbookWsClient extends BaseChannelWsClient<
  OrderbookChannel,
  OrderbookEventHandler,
  OrderbookSubscribeRequest,
  OrderbookUnsubscribeRequest
> {
  constructor(url: string) {
    super(url);
  }
}

export class TradesWsClient extends BaseChannelWsClient<
  TradesChannel,
  TradesEventHandler,
  TradesSubscribeRequest,
  TradesUnsubscribeRequest
> {
  constructor(url: string) {
    super(url);
  }
}
