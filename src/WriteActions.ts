import { Aptos } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

import { OptionsEkiden } from "./interface";

export class WriteActions {
  private options: OptionsEkiden;
  private provider: Aptos;

  constructor(options: OptionsEkiden, provider: Aptos) {
    this.options = options;
    this.provider = provider;
  }

  async deposit(token: string, amount: string) {
    const { signAndSubmitTransaction } = useWallet();
    const tx = await signAndSubmitTransaction({
      sender: this.options.wallet,
      data: {
        function:
          "0x9fb5e1f077163b539d22d92d3ffe1d87cd3490963bf98ce7e222c5e9f8fe31a4::perpetual_vault::deposit",
        typeArguments: [
          `${token}::perpetual_vault_type::UserVault`,
          `${token}::perpetual_collateral::PerpetualCollateral`,
        ],
        functionArguments: [amount],
      },
    });
    await this.provider.waitForTransaction({ transactionHash: tx.hash });
  }

  async withdraw(token: string, amount: string) {
    const { signAndSubmitTransaction } = useWallet();
    const tx = await signAndSubmitTransaction({
      sender: this.options.wallet,
      data: {
        function:
          "0x9fb5e1f077163b539d22d92d3ffe1d87cd3490963bf98ce7e222c5e9f8fe31a4::perpetual_vault::withdraw",
        typeArguments: [
          `${token}::perpetual_vault_type::UserVault`,
          `${token}::perpetual_collateral::PerpetualCollateral`,
        ],
        functionArguments: [amount],
      },
    });

    await this.provider.waitForTransaction({ transactionHash: tx.hash });
  }
}
