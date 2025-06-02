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
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::deposit`,
      functionArguments: [args.assetMetadata, args.amount],
      abi: parseAbi({
        generic_type_params: [],
        params: [
          "&signer",
          "0x1::object::Object<0x1::fungible_asset::Metadata>",
          "u64",
        ],
      }),
    };
  }

  static withdraw(args: {
    vaultAddress: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::withdraw`,
      functionArguments: [args.assetMetadata, args.amount],
      abi: parseAbi({
        generic_type_params: [],
        params: [
          "&signer",
          "0x1::object::Object<0x1::fungible_asset::Metadata>",
          "u64",
        ],
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
