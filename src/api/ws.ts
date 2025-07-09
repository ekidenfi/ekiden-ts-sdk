import ReconnectingWebSocket from "reconnecting-websocket";

export class WsClient<
  Channel extends string = string,
  EventMap extends Record<Channel, any> = Record<string, any>,
> {
  private ws: ReconnectingWebSocket;
  private handlers: Map<Channel, Set<(event: EventMap[Channel]) => void>> =
    new Map();

  constructor(private url: string) {
    this.ws = new ReconnectingWebSocket(url);
    this.ws.addEventListener("message", (event) => this.handleMessage(event));
  }

  subscribe<C extends Channel = Channel>(
    channel: C,
    handler: (event: EventMap[C]) => void,
  ) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      this.send({ method: "subscribe", channel });
    }
    this.handlers.get(channel)!.add(handler as any);
  }

  unsubscribe<C extends Channel = Channel>(
    channel: C,
    handler: (event: EventMap[C]) => void,
  ) {
    const set = this.handlers.get(channel);
    if (!set) return;
    set.delete(handler as any);
    if (set.size === 0) {
      this.send({ method: "unsubscribe", channel });
      this.handlers.delete(channel);
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "event" && this.handlers.has(msg.channel)) {
        this.handlers.get(msg.channel)!.forEach((h) => h(msg));
      }
    } catch (err) {
      console.warn(`[WsClient] Failed to parse message`, err);
    }
  }

  private send(msg: any) {
    this.ws.send(JSON.stringify(msg));
  }

  close() {
    this.ws.close();
  }
}
