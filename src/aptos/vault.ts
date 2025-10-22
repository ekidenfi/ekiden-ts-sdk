import {
  AccountAddress,
  type AccountAddressInput,
  type InputEntryFunctionData,
  InputViewFunctionData,
} from "@aptos-labs/ts-sdk";

import { parseAbi } from "@/utils";

export interface SubAccountData {
  types: string[][];
  owners: string[];
  subs: string[];
  pubks: string[][];
  nonces: string[];
  metadatas: Array<{ inner: string }>;
}

export const decodeHexToString = (hex: string): string => {
  const hexString = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(
    hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
  );
  return new TextDecoder().decode(bytes);
};

export const parseSubAccountsData = (result: unknown[]): SubAccountData => {
  const [types, owners, subs, pubks, nonces, metadatas] = result as [
    string[][],
    string[],
    string[],
    string[][],
    string[],
    Array<{ inner: string }>,
  ];

  return {
    types,
    owners,
    subs,
    pubks,
    nonces,
    metadatas,
  };
};

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
    subAddress: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::deposit_into_funding`,
      functionArguments: [
        args.subAddress,
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

  static depositIntoFundingWithTransferToTrading(args: {
    vaultAddress: string;
    fundingSubAddress: string;
    tradingSubAddress: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::deposit_into_funding_with_transfer_to_cross_trading`,
      functionArguments: [
        args.fundingSubAddress,
        args.tradingSubAddress,
        AccountAddress.from(args.assetMetadata),
        args.amount,
      ],
      abi: parseAbi({
        generic_type_params: [],
        params: [
          "&signer",
          "address",
          "address",
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

  static withdrawFromFunding(args: {
    vaultAddress: string;
    subAccAddress?: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    const subAccOption = args.subAccAddress ? args.subAccAddress : null;

    return {
      function: `${args.vaultAddress}::vault::withdraw_from_funding`,
      functionArguments: [
        subAccOption,
        AccountAddress.from(args.assetMetadata),
        args.amount,
      ],
      abi: parseAbi({
        generic_type_params: [],
        params: [
          "&signer",
          "0x1::option::Option<address>",
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
      function: `${args.vaultAddress}::vault::is_cross_trading_vault_exists`,
      functionArguments: [
        AccountAddress.from(args.subAddress),
        AccountAddress.from(args.assetMetadata),
      ],
    };
  }

  static transfer(args: {
    vaultAddress: string;
    vaultFrom?: string;
    vaultTo?: string;
    assetMetadata: string;
    amount: bigint;
    vaultFromType: string;
    vaultToType: string;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::transfer`,
      typeArguments: [args.vaultFromType, args.vaultToType],
      functionArguments: [
        args.vaultFrom || null,
        args.vaultTo || null,
        AccountAddress.from(args.assetMetadata),
        args.amount,
      ],
      abi: parseAbi({
        generic_type_params: [{ constraints: [] }, { constraints: [] }],
        params: [
          "&signer",
          "0x1::option::Option<address>",
          "0x1::option::Option<address>",
          "0x1::object::Object<0x1::fungible_asset::Metadata>",
          "u64",
        ],
      }),
    };
  }

  static getSubAccs(args: {
    vaultAddress: string;
    subAddresses: string[];
  }): InputViewFunctionData {
    return {
      function: `${args.vaultAddress}::user::get_sub_accs`,
      functionArguments: [args.subAddresses],
    };
  }

  static createEkidenUser(args: {
    vaultAddress: string;
    fundingLinkProof: Uint8Array;
    crossTradingLinkProof: Uint8Array;
    assetMetadata: string;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::user::create_ekiden_user`,
      functionArguments: [
        args.fundingLinkProof,
        args.crossTradingLinkProof,
        AccountAddress.from(args.assetMetadata),
      ],
      abi: parseAbi({
        generic_type_params: [],
        params: [
          "&signer",
          "vector<u8>",
          "vector<u8>",
          "0x1::object::Object<0x1::fungible_asset::Metadata>",
        ],
      }),
    };
  }

  static createAndLinkSubAccount(args: {
    vaultAddress: string;
    linkProof: Uint8Array;
    assetMetadata: string;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::user::create_and_link_sub_account`,
      typeArguments: [`${args.vaultAddress}::user::CrossTrading`],
      functionArguments: [
        args.linkProof,
        AccountAddress.from(args.assetMetadata),
      ],
      abi: parseAbi({
        generic_type_params: [{ constraints: [] }],
        params: [
          "&signer",
          "vector<u8>",
          "0x1::object::Object<0x1::fungible_asset::Metadata>",
        ],
      }),
    };
  }
}
