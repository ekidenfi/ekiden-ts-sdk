import {
  AccountAddress,
  type AccountAddressInput,
  type InputEntryFunctionData,
  InputViewFunctionData,
  MoveOption,
  MoveVector,
  U8,
} from "@aptos-labs/ts-sdk";

import { parseAbi } from "@/utils";

export class Vault {
  static requestWithdrawFromUser(args: {
    vaultAddress: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::request_withdraw_from_user`,
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

  static requestWithdrawFromUserSub(args: {
    vaultAddress: string;
    subUserAddress: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::request_withdraw_from_user_sub`,
      functionArguments: [args.subUserAddress, args.assetMetadata, args.amount],
      abi: parseAbi({
        generic_type_params: [],
        params: [
          "&signer",
          "address",
          "0x1::object::Object<0x1::fungible_asset::Metadata>",
          "u64",
        ],
      }),
    };
  }

  static depositIntoUser(args: {
    vaultAddress: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::deposit_into_user`,
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

  static depositIntoUserSub(args: {
    vaultAddress: string;
    subAddress: Uint8Array;
    rootAddress: Uint8Array;
    signature: Uint8Array;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    // Build sub link proof: pubkey(32) || root_addr(32) || sig(64)
    const proofBytes = new Uint8Array(
      args.subAddress.length + args.rootAddress.length + args.signature.length,
    );
    proofBytes.set(args.subAddress, 0);
    proofBytes.set(args.rootAddress, args.subAddress.length);
    proofBytes.set(
      args.signature,
      args.subAddress.length + args.rootAddress.length,
    );

    const noneAddr = new MoveOption<AccountAddress>();
    const proofOpt = new MoveOption<MoveVector<U8>>(MoveVector.U8(proofBytes));

    return {
      function: `${args.vaultAddress}::vault::deposit_into_funding_with_transfer_to_trading`,
      functionArguments: [
        noneAddr, // existing_funding_sub
        proofOpt, // new_funding_sub_link_proof
        noneAddr, // existing_trading_sub
        proofOpt, // new_trading_sub_link_proof
        args.assetMetadata,
        args.amount,
      ],
      abi: parseAbi({
        generic_type_params: [],
        params: [
          "&signer",
          "0x1::option::Option<address>",
          "0x1::option::Option<vector<u8>>",
          "0x1::option::Option<address>",
          "0x1::option::Option<vector<u8>>",
          "0x1::object::Object<0x1::fungible_asset::Metadata>",
          "u64",
        ],
      }),
    };
  }

  static withdrawFromUserSub(args: {
    vaultAddress: string;
    subUserAddress: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::withdraw_from_user_sub`,
      functionArguments: [args.subUserAddress, args.assetMetadata, args.amount],
      abi: parseAbi({
        generic_type_params: [],
        params: [
          "&signer",
          "address",
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
