import { EkidenClientConfig } from "../config";
import { HttpAPIClient } from "./api/http";
import { AptosVault } from "./aptos/vault";

export class EkidenClient {
  readonly config: EkidenClientConfig;
  readonly httpApi: HttpAPIClient;
  readonly vault: AptosVault;

  constructor(config: EkidenClientConfig) {
    this.config = config;
    this.httpApi = new HttpAPIClient(config);
    this.vault = new AptosVault(config);
  }
}
