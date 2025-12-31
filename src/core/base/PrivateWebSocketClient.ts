import ReconnectingWebSocket from "reconnecting-websocket";

import { HEARTBEAT_INTERVAL_MS } from "@/core/constants";
import { AuthenticationError, WebSocketError } from "@/core/errors";

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

export class PrivateWebSocketClient {
  private ws?: ReconnectingWebSocket;
  private token?: string;
  private isAuthenticated = false;
  private subscriptions = new Set<string>();
  private handlers = new Map<string, Set<(data: any) => void>>();
  private reqIdCounter = 0;
  private heartbeatInterval?: ReturnType<typeof setInterval>;

  constructor(private url: string) {}

  public setToken(token: string): void {
    this.token = token;
  }

  private generateReqId(): string {
    return `req_${++this.reqIdCounter}`;
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.ws = new ReconnectingWebSocket(this.url);

      this.ws.addEventListener("open", () => {
        if (this.token) {
          this.authenticate();
        }
      });

      this.ws.addEventListener("message", (event) => {
        this.handleMessage(event);
      });

      this.ws.addEventListener("error", (error) => {
        console.error("[PrivateWebSocketClient] WebSocket error:", error);
        reject(error);
      });

      const handleAuth = (message: PrivateWSMessage) => {
        if (message.op === "auth") {
          if (message.success) {
            this.isAuthenticated = true;
            this.startHeartbeat();
            resolve();
          } else {
            console.error("[PrivateWebSocketClient] Authentication failed:", message.message);
            reject(new Error(message.message || "Authentication failed"));
          }
        }
      };

      this.ws.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data) as PrivateWSMessage;
          handleAuth(message);
        } catch (err) {
          console.warn("[PrivateWebSocketClient] Failed to parse auth message", err);
        }
      });
    });
  }

  private authenticate(): void {
    if (!this.token) {
      throw new AuthenticationError("No token provided");
    }

    const authRequest: AuthRequest = {
      op: "auth",
      bearer: this.token,
      req_id: this.generateReqId(),
    };

    this.send(authRequest);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const pingRequest: PingRequest = {
        op: "ping",
        ts: Date.now() * 1e6,
        req_id: this.generateReqId(),
      };
      this.send(pingRequest);
    }, HEARTBEAT_INTERVAL_MS);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as PrivateWSMessage;

      switch (message.op) {
        case "error":
          console.warn("[PrivateWebSocketClient] WebSocket error:", message.message);
          break;
        case "event":
          this.handleEvent(message);
          break;
      }
    } catch (err) {
      console.warn("[PrivateWebSocketClient] Failed to parse message", err);
    }
  }

  private handleEvent(event: EventResponse): void {
    const handlers = this.handlers.get(event.topic);
    if (handlers && handlers.size > 0) {
      handlers.forEach((handler) => handler(event.data));
    } else {
      console.warn("[PrivateWebSocketClient] No handlers found for topic:", event.topic);
    }
  }

  subscribe(topic: string, handler: (data: any) => void): void;
  subscribe(topics: string[], handler: (data: any) => void): void;
  subscribe(handlers: Record<string, (data: any) => void>): void;
  subscribe(arg1: any, arg2?: (data: any) => void): void {
    if (!this.isAuthenticated) {
      console.error("[PrivateWebSocketClient] Cannot subscribe - not authenticated");
      throw new AuthenticationError("Cannot subscribe - not authenticated");
    }

    if (!Array.isArray(arg1) && typeof arg1 === "object" && arg1) {
      const handlersMap = arg1 as Record<string, (data: any) => void>;
      const topics = Object.keys(handlersMap);
      if (topics.length === 0) throw new WebSocketError("handlers map must not be empty");
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
        this.send(subscribeRequest);
      }
      return;
    }

    if (Array.isArray(arg1)) {
      const topics = arg1 as string[];
      const handler = arg2 as (data: any) => void;
      if (!Array.isArray(topics) || topics.length === 0) {
        throw new WebSocketError("topics must be a non-empty string[]");
      }
      if (typeof handler !== "function") {
        throw new WebSocketError("handler must be a function");
      }
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
        this.send(subscribeRequest);
      }
      return;
    }

    const topic = arg1 as string;
    const handler = arg2 as (data: any) => void;
    if (typeof topic !== "string" || !topic) {
      throw new WebSocketError("topic must be a non-empty string");
    }
    if (typeof handler !== "function") {
      throw new WebSocketError("handler must be a function");
    }

    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler);
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.add(topic);
      const subscribeRequest: SubscribeRequest = {
        op: "subscribe",
        args: [topic],
        req_id: this.generateReqId(),
      };
      this.send(subscribeRequest);
    }
  }

  unsubscribe(topic: string, handler: (data: any) => void): void;
  unsubscribe(topics: string[], handler: (data: any) => void): void;
  unsubscribe(handlers: Record<string, (data: any) => void>): void;
  unsubscribe(arg1: any, arg2?: (data: any) => void): void {
    if (!Array.isArray(arg1) && typeof arg1 === "object" && arg1) {
      const handlersMap = arg1 as Record<string, (data: any) => void>;
      const topics = Object.keys(handlersMap);
      if (topics.length === 0) return;
      const toUnsubscribe: string[] = [];
      for (const topic of topics) {
        const handler = handlersMap[topic];
        const handlers = this.handlers.get(topic);
        if (!handlers || typeof handler !== "function") {
          console.warn("[PrivateWebSocketClient] No handlers found for topic:", topic);
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

    if (Array.isArray(arg1)) {
      const topics = arg1 as string[];
      const handler = arg2 as (data: any) => void;
      if (!Array.isArray(topics) || topics.length === 0) {
        throw new WebSocketError("topics must be a non-empty string[]");
      }

      const toUnsubscribe: string[] = [];

      for (const topic of topics) {
        const handlers = this.handlers.get(topic);
        if (!handlers) {
          console.warn("[PrivateWebSocketClient] No handlers found for topic:", topic);
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

    const topic = arg1 as string;
    const handler = arg2 as (data: any) => void;
    if (typeof topic !== "string" || !topic) {
      throw new WebSocketError("topic must be a non-empty string");
    }

    const handlers = this.handlers.get(topic);
    if (!handlers) {
      console.warn("[PrivateWebSocketClient] No handlers found for topic:", topic);
      return;
    }

    handlers.delete(handler);
    if (handlers.size === 0) {
      this.handlers.delete(topic);
      this.subscriptions.delete(topic);
      const unsubscribeRequest: UnsubscribeRequest = {
        op: "unsubscribe",
        args: [topic],
        req_id: this.generateReqId(),
      };
      this.send(unsubscribeRequest);
    }
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn(
        "[PrivateWebSocketClient] Cannot send message - WebSocket not open, readyState:",
        this.ws?.readyState
      );
    }
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
    this.isAuthenticated = false;
    this.subscriptions.clear();
    this.handlers.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
}
