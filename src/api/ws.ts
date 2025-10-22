import ReconnectingWebSocket from "reconnecting-websocket";

export class WsClient<
  Channel extends string = string,
  EventMap extends Record<Channel, any> = Record<string, any>,
> {
  private ws: ReconnectingWebSocket;
  private handlers: Map<Channel, Set<(event: EventMap[Channel]) => void>> =
    new Map();
  private reqIdCounter = 101001;

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
      this.send({
        op: "subscribe",
        args: [channel],
        req_id: (this.reqIdCounter++).toString(),
      });
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
      this.send({
        op: "unsubscribe",
        args: [channel],
        req_id: (this.reqIdCounter++).toString(),
      });
      this.handlers.delete(channel);
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const msg = JSON.parse(event.data);
      if (msg.op === "event" && this.handlers.has(msg.topic)) {
        this.handlers.get(msg.topic)!.forEach((h) => h(msg));
      } else if (msg.op === "subscribed" && msg.args?.length > 0) {
        console.log(
          `[WsClient] Subscribed to: ${msg.args[0]} (req_id: ${msg.req_id})`,
        );
      } else if (msg.op === "unsubscribed" && msg.args?.length > 0) {
        console.log(
          `[WsClient] Unsubscribed from: ${msg.args[0]} (req_id: ${msg.req_id})`,
        );
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
