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

  static depositIntoUserSub(args: {
    vaultAddress: string;
    subAddress: Uint8Array;
    rootAddress: Uint8Array;
    signature: Uint8Array;
    assetMetadata: string;
    amount: bigint;
    fundingSubAddress: string;
    tradingSubAddress: string;
    tradingSubKey: Uint8Array;
    tradingRootAddress: Uint8Array;
    tradingSignature: Uint8Array;
  }): InputEntryFunctionData {
    // Build funding sub link proof: pubkey(32) || root_addr(32) || sig(64)
    const fundingProofBytes = new Uint8Array(
      args.subAddress.length + args.rootAddress.length + args.signature.length,
    );
    fundingProofBytes.set(args.subAddress, 0);
    fundingProofBytes.set(args.rootAddress, args.subAddress.length);
    fundingProofBytes.set(
      args.signature,
      args.subAddress.length + args.rootAddress.length,
    );

    // Build trading sub proof: trading_pubkey(32) || root_addr(32) || trading_sig(64)
    const tradingProofBytes = new Uint8Array(
      args.tradingSubKey.length +
        args.tradingRootAddress.length +
        args.tradingSignature.length,
    );
    tradingProofBytes.set(args.tradingSubKey, 0);
    tradingProofBytes.set(args.tradingRootAddress, args.tradingSubKey.length);
    tradingProofBytes.set(
      args.tradingSignature,
      args.tradingSubKey.length + args.tradingRootAddress.length,
    );

    return {
      function: `${args.vaultAddress}::vault::deposit_into_funding_with_transfer_to_trading`,
      functionArguments: [
        null, // funding_sub (use funding address instead of None)
        null, // funding_proof - Option with MoveVector
        AccountAddress.from(args.tradingSubAddress), // trading_sub (required address)
        null, // trading_proof (now using proper trading proof)
        AccountAddress.from(args.assetMetadata),
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
