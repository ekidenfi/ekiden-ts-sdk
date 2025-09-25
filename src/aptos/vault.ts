import {
  AccountAddress,
  type AccountAddressInput,
  type InputEntryFunctionData,
  InputViewFunctionData,
  MoveOption,
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
      functionArguments: [AccountAddress.from(args.assetMetadata), args.amount],
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
      functionArguments: [
        args.subUserAddress,
        AccountAddress.from(args.assetMetadata),
        args.amount,
      ],
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
      functionArguments: [AccountAddress.from(args.assetMetadata), args.amount],
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

  static depositIntoFunding(args: {
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
    return {
      function: `${args.vaultAddress}::vault::deposit_into_funding`,
      functionArguments: [
        noneAddr, // existing_sub
        null, // new_sub_link_proof
        AccountAddress.from(args.assetMetadata),
        args.amount,
      ],
      abi: parseAbi({
        generic_type_params: [],
        params: [
          "&signer",
          "0x1::option::Option<address>",
          "0x1::option::Option<vector<u8>>",
          "0x1::object::Object<0x1::fungible_asset::Metadata>",
          "u64",
        ],
      }),
    };
  }

  static depositIntoFundingWithTransferToTrading(args: {
    vaultAddress: string;
    fundingSubAddress?: string;
    fundingProof?: Uint8Array;
    tradingSubAddress: string;
    tradingProof?: Uint8Array;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    // For wallet compatibility, we need to pass options differently
    const fundingSubOption = args.fundingSubAddress || null;
    const fundingProofOption = args.fundingProof || null;
    const tradingProofOption = args.tradingProof || null;

    return {
      function: `${args.vaultAddress}::vault::deposit_into_funding_with_transfer_to_trading`,
      functionArguments: [
        fundingSubOption,
        fundingProofOption,
        args.tradingSubAddress,
        tradingProofOption,
        args.assetMetadata,
        args.amount,
      ],
      abi: parseAbi({
        generic_type_params: [],
        params: [
          "&signer",
          "0x1::option::Option<address>",
          "0x1::option::Option<vector<u8>>",
          "address",
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
      functionArguments: [
        args.subUserAddress,
        AccountAddress.from(args.assetMetadata),
        args.amount,
      ],
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

  static ownedSubAccs(args: {
    vaultAddress: string;
    userAddress: AccountAddressInput;
  }): InputViewFunctionData {
    return {
      function: `${args.vaultAddress}::user::owned_sub_accs`,
      functionArguments: [AccountAddress.from(args.userAddress)],
    };
  }

  static isEkidenUser(args: {
    ekidenAddress: string;
    userAddress: AccountAddressInput;
  }): InputViewFunctionData {
    return {
      function: `${args.ekidenAddress}::userr::is_ekiden_user`,
      functionArguments: [AccountAddress.from(args.userAddress)],
    };
  }

  static isFundingVaultExists(args: {
    vaultAddress: string;
    userAddress: AccountAddressInput;
    assetMetadata: string;
  }): InputViewFunctionData {
    return {
      function: `${args.vaultAddress}::vault::is_funding_vault_exists`,
      functionArguments: [
        AccountAddress.from(args.userAddress),
        AccountAddress.from(args.assetMetadata),
      ],
    };
  }

  static isTradingVaultExists(args: {
    vaultAddress: string;
    subAddress: AccountAddressInput;
    assetMetadata: string;
  }): InputViewFunctionData {
    return {
      function: `${args.vaultAddress}::vault::is_trading_vault_exists`,
      functionArguments: [
        AccountAddress.from(args.subAddress),
        AccountAddress.from(args.assetMetadata),
      ],
    };
  }
}
