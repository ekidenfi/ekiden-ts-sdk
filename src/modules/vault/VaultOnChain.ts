import {
  AccountAddress,
  type AccountAddressInput,
  type InputEntryFunctionData,
  type InputViewFunctionData,
} from "@aptos-labs/ts-sdk";

import { parseAbi } from "@/utils/abi";

export interface SubAccountData {
  orderIndexes: string[];
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
    hexString.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || []
  );
  return new TextDecoder().decode(bytes);
};

export const parseSubAccountsData = (result: unknown[]): SubAccountData => {
  const [orderIndexes, types, owners, subs, pubks, nonces, metadatas] = result as [
    string[],
    string[][],
    string[],
    string[],
    string[][],
    string[],
    Array<{ inner: string }>,
  ];

  return {
    orderIndexes,
    types,
    owners,
    subs,
    pubks,
    nonces,
    metadatas,
  };
};

export class VaultOnChain {
  requestWithdrawFromUser(args: {
    vaultAddress: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::request_withdraw_from_user`,
      functionArguments: [AccountAddress.from(args.assetMetadata), args.amount],
      abi: parseAbi({
        generic_type_params: [],
        params: ["&signer", "0x1::object::Object<0x1::fungible_asset::Metadata>", "u64"],
      }),
    };
  }

  requestWithdrawFromUserSub(args: {
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
        params: ["&signer", "address", "0x1::object::Object<0x1::fungible_asset::Metadata>", "u64"],
      }),
    };
  }

  depositIntoUser(args: {
    vaultAddress: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::deposit_into_user`,
      functionArguments: [AccountAddress.from(args.assetMetadata), args.amount],
      abi: parseAbi({
        generic_type_params: [],
        params: ["&signer", "0x1::object::Object<0x1::fungible_asset::Metadata>", "u64"],
      }),
    };
  }

  depositIntoFunding(args: {
    vaultAddress: string;
    subAddress: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::deposit_into_funding`,
      functionArguments: [args.subAddress, AccountAddress.from(args.assetMetadata), args.amount],
      abi: parseAbi({
        generic_type_params: [],
        params: ["&signer", "address", "0x1::object::Object<0x1::fungible_asset::Metadata>", "u64"],
      }),
    };
  }

  depositIntoFundingWithTransferTo(args: {
    vaultAddress: string;
    fundingSubAddress: string;
    tradingSubAddress: string;
    assetMetadata: string;
    amount: bigint;
    vaultToType: string;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::deposit_into_funding_with_transfer_to`,
      typeArguments: [`${args.vaultAddress}::vault_types::${args.vaultToType}`],
      functionArguments: [
        args.fundingSubAddress,
        args.tradingSubAddress,
        AccountAddress.from(args.assetMetadata),
        args.amount,
      ],
      abi: parseAbi({
        generic_type_params: [{ constraints: [] }],
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

  withdrawFromUserSub(args: {
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
        params: ["&signer", "address", "0x1::object::Object<0x1::fungible_asset::Metadata>", "u64"],
      }),
    };
  }

  withdrawFromFunding(args: {
    vaultAddress: string;
    subAddress: string;
    assetMetadata: string;
    amount: bigint;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::withdraw_from_funding`,
      functionArguments: [args.subAddress, AccountAddress.from(args.assetMetadata), args.amount],
      abi: parseAbi({
        generic_type_params: [],
        params: ["&signer", "address", "0x1::object::Object<0x1::fungible_asset::Metadata>", "u64"],
      }),
    };
  }

  vaultBalance(args: {
    vaultAddress: string;
    userAddress: AccountAddressInput;
    assetMetadata: string;
    vaultType: string;
  }): InputViewFunctionData {
    return {
      function: `${args.vaultAddress}::vault::vault_balance`,
      typeArguments: [`${args.vaultAddress}::vault_types::${args.vaultType}`],
      functionArguments: [
        AccountAddress.from(args.userAddress),
        AccountAddress.from(args.assetMetadata),
      ],
    };
  }

  ekidenVaultBalance(args: { vaultAddress: string }): InputViewFunctionData {
    return {
      function: `${args.vaultAddress}::vault::ekiden_vault_balance`,
      functionArguments: [],
    };
  }

  insuranceVaultBalance(args: { vaultAddress: string }): InputViewFunctionData {
    return {
      function: `${args.vaultAddress}::vault::insurance_vault_balance`,
      functionArguments: [],
    };
  }

  ownedSubAccs(args: {
    vaultAddress: string;
    userAddress: AccountAddressInput;
  }): InputViewFunctionData {
    return {
      function: `${args.vaultAddress}::user::owned_sub_accs`,
      functionArguments: [AccountAddress.from(args.userAddress)],
    };
  }

  isEkidenUser(args: {
    ekidenAddress: string;
    userAddress: AccountAddressInput;
  }): InputViewFunctionData {
    return {
      function: `${args.ekidenAddress}::userr::is_ekiden_user`,
      functionArguments: [AccountAddress.from(args.userAddress)],
    };
  }

  isFundingVaultExists(args: {
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

  isTradingVaultExists(args: {
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

  transfer(args: {
    vaultAddress: string;
    vaultFrom?: string;
    vaultTo?: string;
    amount: bigint;
    vaultFromType: string;
    vaultToType: string;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::vault::transfer`,
      typeArguments: [
        `${args.vaultAddress}::vault_types::${args.vaultFromType}`,
        `${args.vaultAddress}::vault_types::${args.vaultToType}`,
      ],
      functionArguments: [
        args.vaultFrom ? AccountAddress.from(args.vaultFrom) : undefined,
        args.vaultTo ? AccountAddress.from(args.vaultTo) : undefined,
        args.amount,
      ],
      abi: parseAbi({
        generic_type_params: [{ constraints: [] }, { constraints: [] }],
        params: ["&signer", "0x1::option::Option<address>", "0x1::option::Option<address>", "u64"],
      }),
    };
  }

  getSubAccs(args: {
    vaultAddress: string;
    subAddresses: string[];
  }): InputViewFunctionData {
    return {
      function: `${args.vaultAddress}::user::get_sub_accs`,
      functionArguments: [args.subAddresses],
    };
  }

  createEkidenUser(args: {
    vaultAddress: string;
    fundingLinkProof: Uint8Array;
    crossTradingLinkProof: Uint8Array;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::user::create_ekiden_user`,
      functionArguments: [args.fundingLinkProof, args.crossTradingLinkProof],
      abi: parseAbi({
        generic_type_params: [],
        params: ["&signer", "vector<u8>", "vector<u8>"],
      }),
    };
  }

  createAndLinkSubAccount(args: {
    vaultAddress: string;
    linkProof: Uint8Array;
    vaultType?: string;
  }): InputEntryFunctionData {
    return {
      function: `${args.vaultAddress}::user::create_and_link_sub_account`,
      typeArguments: [`${args.vaultAddress}::user::CrossTrading`],
      functionArguments: [args.linkProof],
      abi: parseAbi({
        generic_type_params: [{ constraints: [] }],
        params: ["&signer", "vector<u8>"],
      }),
    };
  }
}
