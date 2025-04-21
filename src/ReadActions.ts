import { Aptos } from "@aptos-labs/ts-sdk";
import { AptosClient } from "aptos";
import { MoveResource, OptionsEkiden } from "src/interface";

export class ReadActions {
  private options: OptionsEkiden;
  private provider: Aptos;
  private clientProvider: AptosClient;

  constructor(
    options: OptionsEkiden,
    provider: Aptos,
    clientProvider: AptosClient,
  ) {
    this.options = options;
    this.provider = provider;
    this.clientProvider = clientProvider;
  }

  async getContractBalance(): Promise<string[]> {
    return await this.provider.view({
      payload: {
        function: `${this.options.wallet}::perpetual_vault::balanceOf`,
        typeArguments: [
          `${this.options.wallet}::perpetual_vault_type::UserVault`,
          `${this.options.wallet}::perpetual_collateral::PerpetualCollateral`,
        ],
        functionArguments: [this.options.wallet],
      },
    });
  }

  async getWalletBalance(): Promise<MoveResource[]> {
    return await this.clientProvider.getAccountResources(
      this.options.wallet as string,
    );
  }
}
