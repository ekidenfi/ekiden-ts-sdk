import { EkidenClientConfig } from "src/config";
import { VaultReadClient, VaultWriteClient } from "../../aptos/vault";

export class AptosVault {
  read: VaultReadClient;
  write: VaultWriteClient;

  constructor(config: EkidenClientConfig) {
    this.read = new VaultReadClient(
      { wallet: config.wallet },
      config.aptos!,
      config.aptosClient!
    );
    this.write = new VaultWriteClient(
      { wallet: config.wallet },
      config.aptos!
    );
  }
}
