import { PrivateWebSocketClient } from "@/core/base";

export class PrivateStream {
  private ws: PrivateWebSocketClient;

  constructor(url: string) {
    this.ws = new PrivateWebSocketClient(url);
  }

  setToken(token: string): void {
    this.ws.setToken(token);
  }

  async connect(): Promise<void> {
    return this.ws.connect();
  }

  subscribe(topics: string[], handler: (data: any) => void): void;
  subscribe(handlers: Record<string, (data: any) => void>): void;
  subscribe(arg1: any, arg2?: (data: any) => void): void {
    if (arg2 !== undefined) {
      this.ws.subscribe(arg1, arg2);
    } else {
      this.ws.subscribe(arg1);
    }
  }

  unsubscribe(topics: string[], handler: (data: any) => void): void;
  unsubscribe(handlers: Record<string, (data: any) => void>): void;
  unsubscribe(arg1: any, arg2?: (data: any) => void): void {
    if (arg2 !== undefined) {
      this.ws.unsubscribe(arg1, arg2);
    } else {
      this.ws.unsubscribe(arg1);
    }
  }

  close(): void {
    this.ws.close();
  }
}
