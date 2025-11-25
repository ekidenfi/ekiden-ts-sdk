import { BaseWebSocketClient } from "@/core/base";
import { EkidenClientConfig } from "@/core/config";
import { ConfigurationError } from "@/core/errors";
import { ChannelMap } from "@/types/websocket";

export class PublicStream {
  private ws: BaseWebSocketClient<string, ChannelMap>;

  constructor(config: EkidenClientConfig) {
    if (!config.wsURL) {
      throw new ConfigurationError("WebSocket URL is not configured");
    }
    this.ws = new BaseWebSocketClient(config.wsURL);
  }

  subscribeTopics(
    topics: string[],
    handler: (event: unknown) => void,
  ): () => void {
    this.ws.subscribe(topics as any, handler as any);
    return () => this.ws.unsubscribe(topics as any, handler as any);
  }

  subscribeHandlers(
    handlers: Record<string, (event: unknown) => void>,
  ): () => void {
    this.ws.subscribe(handlers as any);
    return () => this.ws.unsubscribe(handlers as any);
  }

  unsubscribeTopics(topics: string[], handler: (event: unknown) => void): void {
    this.ws.unsubscribe(topics as any, handler as any);
  }

  unsubscribeHandlers(
    handlers: Record<string, (event: unknown) => void>,
  ): void {
    this.ws.unsubscribe(handlers as any);
  }

  close(): void {
    this.ws.close();
  }
}
