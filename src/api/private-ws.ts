import ReconnectingWebSocket from "reconnecting-websocket";

import type { OrderResponse } from "@/types";

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
  data: OrderResponse[];
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
            console.log("[PrivateWSClient] Authentication successful, user_id:", message.user_id);
            this.isAuthenticated = true;
            this.startHeartbeat();
            resolve();
          } else {
            console.error("[PrivateWSClient] Authentication failed:", message.message);
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
          console.log("[PrivateWSClient] Received event for topic:", message.topic, "data length:", message.data?.length);
          this.handleEvent(message);
          break;
      }
    } catch (err) {
      console.warn("[PrivateWSClient] Failed to parse message", err);
    }
  }

  private handleEvent(event: EventResponse) {
    const handlers = this.handlers.get(event.topic);
    if (handlers) {
      console.log("[PrivateWSClient] Calling", handlers.size, "handler(s) for topic:", event.topic);
      handlers.forEach((handler) => handler(event.data));
    } else {
      console.warn("[PrivateWSClient] No handlers found for topic:", event.topic);
    }
  }

  subscribe(topic: string, handler: (data: any) => void) {
    if (!this.isAuthenticated) {
      console.error("[PrivateWSClient] Cannot subscribe - not authenticated");
      throw new Error("Not authenticated");
    }

    console.log("[PrivateWSClient] Subscribing to topic:", topic);

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
      console.log("[PrivateWSClient] Sending subscribe request for topic:", topic);
      this.send(subscribeRequest);
    } else {
      console.log("[PrivateWSClient] Already subscribed to topic:", topic, "- adding handler");
    }
  }

  unsubscribe(topic: string, handler: (data: any) => void) {
    console.log("[PrivateWSClient] Unsubscribing from topic:", topic);
    const handlers = this.handlers.get(topic);
    if (!handlers) {
      console.warn("[PrivateWSClient] No handlers found for topic:", topic);
      return;
    }

    handlers.delete(handler);
    if (handlers.size === 0) {
      console.log("[PrivateWSClient] No more handlers for topic:", topic, "- sending unsubscribe request");
      this.handlers.delete(topic);
      this.subscriptions.delete(topic);
      const unsubscribeRequest: UnsubscribeRequest = {
        op: "unsubscribe",
        args: [topic],
        req_id: this.generateReqId(),
      };
      this.send(unsubscribeRequest);
    } else {
      console.log("[PrivateWSClient] Still have", handlers.size, "handler(s) for topic:", topic);
    }
  }

  private send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[PrivateWSClient] Sending message:", message.op, message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("[PrivateWSClient] Cannot send message - WebSocket not open, readyState:", this.ws?.readyState);
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
