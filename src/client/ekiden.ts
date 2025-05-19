import { HttpAPIClient } from "./api";

import { Vault } from "@/aptos";
import { EkidenClientConfig } from "@/config";

export class EkidenClient {
  readonly httpApi: HttpAPIClient;

  readonly vault = Vault;

  constructor(readonly config: EkidenClientConfig) {
    this.httpApi = new HttpAPIClient(config);
  }
}
