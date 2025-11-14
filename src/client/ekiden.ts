import { HttpAPIClient, WsAPIClient } from "./api";

import { PrivateWSClient } from "@/api/private-ws";
import { Vault } from "@/aptos";
import { EkidenClientConfig } from "@/config";

export class EkidenClient {
  readonly httpApi: HttpAPIClient;
  readonly wsApi?: WsAPIClient;
  readonly privateWS?: PrivateWSClient;

  readonly vault = Vault;

  constructor(readonly config: EkidenClientConfig) {
    this.httpApi = new HttpAPIClient(config);

    if (config.wsURL) {
      this.wsApi = new WsAPIClient(config);
    }

    if (config.privateWSURL) {
      this.privateWS = new PrivateWSClient(config.privateWSURL);
    }
  }

  async setToken(token: string) {
    this.httpApi.api.setToken(token);
    if (this.privateWS) {
      this.privateWS.setToken(token);
      await this.privateWS.connect();
    }
  }

  /**
   * Set tokens for REST and Private WS independently.
   * - rest: Bearer used for HTTP API calls (typically the trading sub-account token)
   * - ws: Bearer used for Private WS auth (can be the root account token to receive all subaccount events)
   * If only one is provided, the other remains unchanged.
   */
  async setTokens(tokens: {
    rest?: string;
    ws?: string;
    connectPrivateWS?: boolean;
  }) {
    const { rest, ws, connectPrivateWS = true } = tokens || {};
    if (rest) {
      this.httpApi.api.setToken(rest);
    }
    if (this.privateWS && ws) {
      // If WS is already connected with a different token, easiest and safest is to reconnect
      // before any subscriptions are made.
      this.privateWS.close();
      this.privateWS.setToken(ws);
      if (connectPrivateWS) {
        await this.privateWS.connect();
      }
    }
  }

  /**
   * Subscribe to topics with a single handler for all.
   */
  subscribeTo(topics: string[], handler: (data: any) => void) {
    if (!this.privateWS) {
      throw new Error("Private WebSocket not configured");
    }
    this.privateWS.subscribe(topics, handler);
  }

  /**
   * Unsubscribe from topics with a single handler for all.
   */
  unsubscribeFrom(topics: string[], handler: (data: any) => void) {
    if (!this.privateWS) {
      throw new Error("Private WebSocket not configured");
    }
    this.privateWS.unsubscribe(topics, handler);
  }

  /**
   * Subscribe with a map of topic -> handler. Each topic gets its own handler.
   */
  subscribeHandlers(handlers: Record<string, (data: any) => void>) {
    if (!this.privateWS) {
      throw new Error("Private WebSocket not configured");
    }
    this.privateWS.subscribe(handlers);
  }

  /**
   * Unsubscribe with a map of topic -> handler.
   */
  unsubscribeHandlers(handlers: Record<string, (data: any) => void>) {
    if (!this.privateWS) {
      throw new Error("Private WebSocket not configured");
    }
    this.privateWS.unsubscribe(handlers);
  }
}
