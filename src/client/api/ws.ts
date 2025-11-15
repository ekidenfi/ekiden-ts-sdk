import { WsClient } from "@/api/ws";
import type { EkidenClientConfig } from "@/config";
import { ChannelMap } from "@/types";

export class WsAPIClient {
  ws: WsClient<string, ChannelMap>;

  constructor(readonly config: EkidenClientConfig) {
    if (!config.wsURL) {
      throw new Error("WebSocket URL is not configured");
    }
    this.ws = new WsClient(config.wsURL);
  }

  /**
   * Subscribe to multiple raw topics with a single handler
   */
  subscribeTopics(topics: string[], handler: (event: unknown) => void) {
    this.ws.subscribe(topics as any, handler as any);
    return () => this.ws.unsubscribe(topics as any, handler as any);
  }

  /**
   * Subscribe with a map of topic -> handler
   */
  subscribeHandlers(handlers: Record<string, (event: unknown) => void>) {
    this.ws.subscribe(handlers as any);
    return () => this.ws.unsubscribe(handlers as any);
  }

  /**
   * Unsubscribe helper for multiple topics + single handler
   */
  unsubscribeTopics(topics: string[], handler: (event: unknown) => void) {
    this.ws.unsubscribe(topics as any, handler as any);
  }

  /**
   * Unsubscribe helper for map of topic -> handler
   */
  unsubscribeHandlers(handlers: Record<string, (event: unknown) => void>) {
    this.ws.unsubscribe(handlers as any);
  }

  close() {
    this.ws.close();
  }
}
