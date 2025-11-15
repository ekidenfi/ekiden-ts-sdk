import ReconnectingWebSocket from "reconnecting-websocket";

export class WsClient<
  Channel extends string = string,
  EventMap extends Record<Channel, any> = Record<string, any>,
> {
  private ws: ReconnectingWebSocket;
  private handlers: Map<Channel, Set<(event: EventMap[Channel]) => void>> =
    new Map();
  private reqIdCounter = 101001;
  private subscriptions = new Set<Channel>();

  constructor(private url: string) {
    this.ws = new ReconnectingWebSocket(url);
    this.ws.addEventListener("open", () => {
      // Re-subscribe to existing topics on reconnect
      const topics = Array.from(this.subscriptions);
      if (topics.length > 0) {
        this.send({
          op: "subscribe",
          args: topics,
          req_id: (this.reqIdCounter++).toString(),
        });
      }
    });
    this.ws.addEventListener("message", (event) => this.handleMessage(event));
  }

  // Overloads
  subscribe<C extends Channel = Channel>(
    channel: C,
    handler: (event: EventMap[C]) => void,
  ): void;
  subscribe<C extends Channel = Channel>(
    channels: C[],
    handler: (event: EventMap[C]) => void,
  ): void;
  subscribe<C extends Channel = Channel>(
    handlers: Partial<Record<C, (event: EventMap[C]) => void>>,
  ): void;
  subscribe(arg1: any, arg2?: any): void {
    // Case 1: mapping object of topic -> handler
    if (!Array.isArray(arg1) && typeof arg1 === "object" && arg1) {
      const handlersMap = arg1 as Record<
        Channel,
        (event: EventMap[Channel]) => void
      >;
      const topics = Object.keys(handlersMap) as Channel[];
      if (topics.length === 0) return;
      const toSubscribe: Channel[] = [];
      for (const topic of topics) {
        const handler = handlersMap[topic];
        if (typeof handler !== "function") continue;
        if (!this.handlers.has(topic)) {
          this.handlers.set(topic, new Set());
        }
        this.handlers.get(topic)!.add(handler as any);
        if (!this.subscriptions.has(topic)) {
          this.subscriptions.add(topic);
          toSubscribe.push(topic);
        }
      }
      if (toSubscribe.length > 0) {
        this.send({
          op: "subscribe",
          args: toSubscribe,
          req_id: (this.reqIdCounter++).toString(),
        });
      }
      return;
    }

    // Case 2: array of channels + single handler
    if (Array.isArray(arg1)) {
      const channels = arg1 as Channel[];
      const handler = arg2 as (event: EventMap[Channel]) => void;
      if (!channels.length || typeof handler !== "function") return;
      const toSubscribe: Channel[] = [];
      for (const channel of channels) {
        if (!this.handlers.has(channel)) {
          this.handlers.set(channel, new Set());
        }
        this.handlers.get(channel)!.add(handler as any);
        if (!this.subscriptions.has(channel)) {
          this.subscriptions.add(channel);
          toSubscribe.push(channel);
        }
      }
      if (toSubscribe.length > 0) {
        this.send({
          op: "subscribe",
          args: toSubscribe,
          req_id: (this.reqIdCounter++).toString(),
        });
      }
      return;
    }

    // Case 3: single channel + single handler
    const channel = arg1 as Channel;
    const handler = arg2 as (event: EventMap[Channel]) => void;
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler as any);
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.add(channel);
      this.send({
        op: "subscribe",
        args: [channel],
        req_id: (this.reqIdCounter++).toString(),
      });
    }
  }

  // Overloads
  unsubscribe<C extends Channel = Channel>(
    channel: C,
    handler: (event: EventMap[C]) => void,
  ): void;
  unsubscribe<C extends Channel = Channel>(
    channels: C[],
    handler: (event: EventMap[C]) => void,
  ): void;
  unsubscribe<C extends Channel = Channel>(
    handlers: Partial<Record<C, (event: EventMap[C]) => void>>,
  ): void;
  unsubscribe(arg1: any, arg2?: any): void {
    // Case 1: mapping object of topic -> handler
    if (!Array.isArray(arg1) && typeof arg1 === "object" && arg1) {
      const handlersMap = arg1 as Record<
        Channel,
        (event: EventMap[Channel]) => void
      >;
      const topics = Object.keys(handlersMap) as Channel[];
      if (topics.length === 0) return;
      const toUnsubscribe: Channel[] = [];
      for (const topic of topics) {
        const handler = handlersMap[topic];
        const set = this.handlers.get(topic);
        if (!set || typeof handler !== "function") continue;
        set.delete(handler as any);
        if (set.size === 0) {
          this.handlers.delete(topic);
          if (this.subscriptions.delete(topic)) {
            toUnsubscribe.push(topic);
          }
        }
      }
      if (toUnsubscribe.length > 0) {
        this.send({
          op: "unsubscribe",
          args: toUnsubscribe,
          req_id: (this.reqIdCounter++).toString(),
        });
      }
      return;
    }

    // Case 2: array of channels + single handler
    if (Array.isArray(arg1)) {
      const channels = arg1 as Channel[];
      const handler = arg2 as (event: EventMap[Channel]) => void;
      if (!channels.length || typeof handler !== "function") return;
      const toUnsubscribe: Channel[] = [];
      for (const channel of channels) {
        const set = this.handlers.get(channel);
        if (!set) continue;
        set.delete(handler as any);
        if (set.size === 0) {
          this.handlers.delete(channel);
          if (this.subscriptions.delete(channel)) {
            toUnsubscribe.push(channel);
          }
        }
      }
      if (toUnsubscribe.length > 0) {
        this.send({
          op: "unsubscribe",
          args: toUnsubscribe,
          req_id: (this.reqIdCounter++).toString(),
        });
      }
      return;
    }

    // Case 3: single channel + handler
    const channel = arg1 as Channel;
    const handler = arg2 as (event: EventMap[Channel]) => void;
    const set = this.handlers.get(channel);
    if (!set) return;
    set.delete(handler as any);
    if (set.size === 0) {
      this.handlers.delete(channel);
      if (this.subscriptions.delete(channel)) {
        this.send({
          op: "unsubscribe",
          args: [channel],
          req_id: (this.reqIdCounter++).toString(),
        });
      }
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const msg = JSON.parse(event.data);
      if (msg.op === "event" && this.handlers.has(msg.topic)) {
        this.handlers.get(msg.topic)!.forEach((h) => h(msg));
      } else if (msg.op === "subscribed" && Array.isArray(msg.args)) {
        console.log(
          `[WsClient] Subscribed to: ${msg.args.join(
            ", ",
          )} (req_id: ${msg.req_id})`,
        );
      } else if (msg.op === "unsubscribed" && Array.isArray(msg.args)) {
        console.log(
          `[WsClient] Unsubscribed from: ${msg.args.join(
            ", ",
          )} (req_id: ${msg.req_id})`,
        );
      }
    } catch (err) {
      console.warn(`[WsClient] Failed to parse message`, err);
    }
  }

  private send(msg: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      // Silently drop to avoid throwing; reconnect handler will resubscribe
      // Callers add handlers regardless of socket state
    }
  }

  close() {
    this.ws.close();
  }
}
