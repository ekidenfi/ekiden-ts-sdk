import {
  AccountAddress,
  type AccountAddressInput,
  type InputEntryFunctionData,
  InputViewFunctionData,
} from "@aptos-labs/ts-sdk";

import { parseAbi } from "@/utils";

export class Vault {
  static deposit(args: {
    vaultAddress: string;
    userAddress: AccountAddressInput;
    token: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::perpetual_vault::deposit`,
      typeArguments: [
        `${args.token}::perpetual_vault_type::UserVault`,
        `${args.token}::perpetual_collateral::PerpetualCollateral`,
      ],
      functionArguments: [AccountAddress.from(args.userAddress), args.amount],
      abi: parseAbi({
        generic_type_params: [{ constraints: [] }, { constraints: [] }],
        params: ["&signer", "address", "u64"],
      }),
    };
  }

  static withdraw(args: {
    vaultAddress: string;
    userAddress: AccountAddressInput;
    token: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::perpetual_vault::withdraw`,
      typeArguments: [
        `${args.token}::perpetual_vault_type::UserVault`,
        `${args.token}::perpetual_collateral::PerpetualCollateral`,
      ],
      functionArguments: [AccountAddress.from(args.userAddress), args.amount],
      abi: parseAbi({
        generic_type_params: [{ constraints: [] }, { constraints: [] }],
        params: ["&signer", "address", "u64"],
      }),
    };
  }

  static balanceOf(args: {
    vaultAddress: string;
    userAddress: AccountAddressInput;
    token: string;
  }): InputViewFunctionData {
    return {
      function: `${args.vaultAddress}::perpetual_vault::balanceOf`,
      typeArguments: [
        `${args.token}::perpetual_vault_type::UserVault`,
        `${args.token}::perpetual_collateral::PerpetualCollateral`,
      ],
      functionArguments: [AccountAddress.from(args.userAddress)],
    };
  }
}
