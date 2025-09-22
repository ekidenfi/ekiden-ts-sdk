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

  subscribeToOrders(handler: (orders: any[]) => void) {
    if (!this.privateWS) {
      throw new Error("Private WebSocket not configured");
    }
    this.privateWS.subscribe("order", handler);
  }

  unsubscribeFromOrders(handler: (orders: any[]) => void) {
    if (!this.privateWS) {
      throw new Error("Private WebSocket not configured");
    }
    this.privateWS.unsubscribe("order", handler);
  }
}
