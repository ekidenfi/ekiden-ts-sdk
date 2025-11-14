import ReconnectingWebSocket from "reconnecting-websocket";

export interface AuthRequest {
  op: "auth";
  bearer: string;
  req_id: string;
}

export interface AuthResponse {
  op: "auth";
  success: boolean;
  user_id?: string;
  message?: string;
  req_id: string;
}

export interface SubscribeRequest {
  op: "subscribe";
  args: string[];
  req_id: string;
}

export interface UnsubscribeRequest {
  op: "unsubscribe";
  args: string[];
  req_id: string;
}

export interface PingRequest {
  op: "ping";
  ts: number;
  req_id: string;
}

export interface PongResponse {
  op: "pong";
  server_ts: number;
  client_ts?: number;
  req_id: string;
}

export interface SubscribeResponse {
  op: "subscribed";
  args: string[];
  req_id: string;
}

export interface UnsubscribeResponse {
  op: "unsubscribed";
  args: string[];
  req_id: string;
}

export interface ErrorResponse {
  op: "error";
  message: string;
  req_id: string;
}

export interface EventResponse {
  op: "event";
  topic: string;
  data: any;
}

type PrivateWSMessage =
  | AuthResponse
  | SubscribeResponse
  | UnsubscribeResponse
  | PongResponse
  | ErrorResponse
  | EventResponse;

export class PrivateWSClient {
  private ws?: ReconnectingWebSocket;
  private token?: string;
  private isAuthenticated = false;
  private subscriptions = new Set<string>();
  private handlers = new Map<string, Set<(data: any) => void>>();
  private reqIdCounter = 0;
  private heartbeatInterval?: ReturnType<typeof setInterval>;

  constructor(private url: string) {}

  setToken(token: string) {
    this.token = token;
  }

  private generateReqId(): string {
    return `req_${++this.reqIdCounter}`;
  }

  async connect(): Promise<void> {
    console.log("[PrivateWSClient] Connecting to:", this.url);
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log("[PrivateWSClient] Already connected");
        resolve();
        return;
      }

      this.ws = new ReconnectingWebSocket(this.url);

      this.ws.addEventListener("open", () => {
        console.log("[PrivateWSClient] WebSocket opened");
        if (this.token) {
          this.authenticate();
        }
      });

      this.ws.addEventListener("message", (event) => {
        this.handleMessage(event);
      });

      this.ws.addEventListener("error", (error) => {
        console.error("[PrivateWSClient] WebSocket error:", error);
        reject(error);
      });

      const handleAuth = (message: PrivateWSMessage) => {
        if (message.op === "auth") {
          if (message.success) {
            console.log(
              "[PrivateWSClient] Authentication successful, user_id:",
              message.user_id,
            );
            this.isAuthenticated = true;
            this.startHeartbeat();
            resolve();
          } else {
            console.error(
              "[PrivateWSClient] Authentication failed:",
              message.message,
            );
            reject(new Error(message.message || "Authentication failed"));
          }
        }
      };

      this.ws.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data) as PrivateWSMessage;
          handleAuth(message);
        } catch (err) {
          console.warn("[PrivateWSClient] Failed to parse auth message", err);
        }
      });
    });
  }

  private authenticate() {
    if (!this.token) {
      throw new Error("No token provided");
    }

    console.log("[PrivateWSClient] Sending authentication request");
    const authRequest: AuthRequest = {
      op: "auth",
      bearer: this.token,
      req_id: this.generateReqId(),
    };

    this.send(authRequest);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const pingRequest: PingRequest = {
        op: "ping",
        ts: Date.now() * 1e6,
        req_id: this.generateReqId(),
      };
      this.send(pingRequest);
    }, 20000);
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data) as PrivateWSMessage;

      switch (message.op) {
        case "subscribed":
          console.log("[PrivateWSClient] Subscribed to:", message.args);
          break;
        case "unsubscribed":
          console.log("[PrivateWSClient] Unsubscribed from:", message.args);
          break;
        case "error":
          console.warn("[PrivateWSClient] WebSocket error:", message.message);
          break;
        case "event":
          console.log(
            "[PrivateWSClient] Received event for topic:",
            message.topic,
            "data length:",
            message.data?.length,
          );
          this.handleEvent(message);
          break;
      }
    } catch (err) {
      console.warn("[PrivateWSClient] Failed to parse message", err);
    }
  }

  private handleEvent(event: EventResponse) {
    const handlers = this.handlers.get(event.topic);
    if (handlers && handlers.size > 0) {
      console.log(
        "[PrivateWSClient] Calling",
        handlers.size,
        "handler(s) for topic:",
        event.topic,
      );
      handlers.forEach((handler) => handler(event.data));
    } else {
      console.warn(
        "[PrivateWSClient] No handlers found for topic:",
        event.topic,
      );
    }
  }

  // Overloads
  subscribe(topics: string[], handler: (data: any) => void): void;
  subscribe(handlers: Record<string, (data: any) => void>): void;

  subscribe(arg1: any, arg2?: (data: any) => void) {
    if (!this.isAuthenticated) {
      console.error("[PrivateWSClient] Cannot subscribe - not authenticated");
      throw new Error("Not authenticated");
    }

    // Case 1: mapping object of topic -> handler
    if (!Array.isArray(arg1) && typeof arg1 === "object" && arg1) {
      const handlersMap = arg1 as Record<string, (data: any) => void>;
      const topics = Object.keys(handlersMap);
      if (topics.length === 0)
        throw new Error("handlers map must not be empty");
      console.log("[PrivateWSClient] Subscribing to topics (map):", topics);
      const toSubscribe: string[] = [];
      for (const topic of topics) {
        const handler = handlersMap[topic];
        if (typeof handler !== "function") continue;
        if (!this.handlers.has(topic)) {
          this.handlers.set(topic, new Set());
        }
        this.handlers.get(topic)!.add(handler);
        if (!this.subscriptions.has(topic)) {
          this.subscriptions.add(topic);
          toSubscribe.push(topic);
        }
      }
      if (toSubscribe.length > 0) {
        const subscribeRequest: SubscribeRequest = {
          op: "subscribe",
          args: toSubscribe,
          req_id: this.generateReqId(),
        };
        console.log(
          "[PrivateWSClient] Sending subscribe request for topics:",
          toSubscribe,
        );
        this.send(subscribeRequest);
      } else {
        console.log(
          "[PrivateWSClient] Already subscribed to all provided topics - added handler(s) only",
        );
      }
      return;
    }

    // Case 2: array of topics + single handler
    const topics = arg1 as string[];
    const handler = arg2 as (data: any) => void;
    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error("topics must be a non-empty string[]");
    }
    if (typeof handler !== "function") {
      throw new Error("handler must be a function");
    }
    console.log("[PrivateWSClient] Subscribing to topics:", topics);
    const toSubscribe: string[] = [];
    for (const topic of topics) {
      if (!this.handlers.has(topic)) {
        this.handlers.set(topic, new Set());
      }
      this.handlers.get(topic)!.add(handler);
      if (!this.subscriptions.has(topic)) {
        this.subscriptions.add(topic);
        toSubscribe.push(topic);
      }
    }
    if (toSubscribe.length > 0) {
      const subscribeRequest: SubscribeRequest = {
        op: "subscribe",
        args: toSubscribe,
        req_id: this.generateReqId(),
      };
      console.log(
        "[PrivateWSClient] Sending subscribe request for topics:",
        toSubscribe,
      );
      this.send(subscribeRequest);
    } else {
      console.log(
        "[PrivateWSClient] Already subscribed to all provided topics - added handler only",
      );
    }
  }

  // Overloads
  unsubscribe(topics: string[], handler: (data: any) => void): void;
  unsubscribe(handlers: Record<string, (data: any) => void>): void;

  unsubscribe(arg1: any, arg2?: (data: any) => void) {
    // Case 1: mapping object topic -> handler
    if (!Array.isArray(arg1) && typeof arg1 === "object" && arg1) {
      const handlersMap = arg1 as Record<string, (data: any) => void>;
      const topics = Object.keys(handlersMap);
      if (topics.length === 0) return;
      console.log("[PrivateWSClient] Unsubscribing (map) from topics:", topics);
      const toUnsubscribe: string[] = [];
      for (const topic of topics) {
        const handler = handlersMap[topic];
        const handlers = this.handlers.get(topic);
        if (!handlers || typeof handler !== "function") {
          console.warn("[PrivateWSClient] No handlers found for topic:", topic);
          continue;
        }
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(topic);
          this.subscriptions.delete(topic);
          toUnsubscribe.push(topic);
        }
      }
      if (toUnsubscribe.length > 0) {
        const unsubscribeRequest: UnsubscribeRequest = {
          op: "unsubscribe",
          args: toUnsubscribe,
          req_id: this.generateReqId(),
        };
        this.send(unsubscribeRequest);
      }
      return;
    }

    // Case 2: array + single handler
    const topics = arg1 as string[];
    const handler = arg2 as (data: any) => void;
    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error("topics must be a non-empty string[]");
    }

    console.log("[PrivateWSClient] Unsubscribing from topics:", topics);
    const toUnsubscribe: string[] = [];

    for (const topic of topics) {
      const handlers = this.handlers.get(topic);
      if (!handlers) {
        console.warn("[PrivateWSClient] No handlers found for topic:", topic);
        continue;
      }

      handlers.delete(handler);
      if (handlers.size === 0) {
        console.log(
          "[PrivateWSClient] No more handlers for topic:",
          topic,
          "- scheduling unsubscribe",
        );
        this.handlers.delete(topic);
        this.subscriptions.delete(topic);
        toUnsubscribe.push(topic);
      } else {
        console.log(
          "[PrivateWSClient] Still have",
          handlers.size,
          "handler(s) for topic:",
          topic,
        );
      }
    }

    if (toUnsubscribe.length > 0) {
      const unsubscribeRequest: UnsubscribeRequest = {
        op: "unsubscribe",
        args: toUnsubscribe,
        req_id: this.generateReqId(),
      };
      this.send(unsubscribeRequest);
    }
  }

  private send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[PrivateWSClient] Sending message:", message.op, message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn(
        "[PrivateWSClient] Cannot send message - WebSocket not open, readyState:",
        this.ws?.readyState,
      );
    }
  }

  close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.isAuthenticated = false;
    this.subscriptions.clear();
    this.handlers.clear();
    this.ws?.close();
  }
}
