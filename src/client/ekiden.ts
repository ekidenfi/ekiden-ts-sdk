import { HttpAPIClient, WsAPIClient } from "./api";

import { Vault } from "@/aptos";
import { EkidenClientConfig } from "@/config";

export class EkidenClient {
  readonly httpApi: HttpAPIClient;
  readonly wsApi?: WsAPIClient;

  readonly vault = Vault;

  constructor(readonly config: EkidenClientConfig) {
    this.httpApi = new HttpAPIClient(config);

    if (config.wsURL) {
      this.wsApi = new WsAPIClient(config);
    }
  }
}
