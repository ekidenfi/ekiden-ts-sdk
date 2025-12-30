import type { EkidenClientConfig } from "@/core/config";

export interface DepositParams {
  vaultAddress: string;
  subAddress: string;
  assetMetadata: string;
  amount: bigint;
}

export interface DepositWithTransferParams {
  vaultAddress: string;
  fundingSubAddress: string;
  tradingSubAddress: string;
  assetMetadata: string;
  amount: bigint;
  vaultToType: string;
}

export interface WithdrawParams {
  vaultAddress: string;
  subAddress: string;
  assetMetadata: string;
  amount: bigint;
}

export interface TransferParams {
  vaultAddress: string;
  vaultFrom: string;
  vaultTo: string;
  amount: bigint;
  vaultFromType: string;
  vaultToType: string;
}

export class VaultOnChainClient {
  constructor(private readonly config: EkidenClientConfig) {}

  depositIntoFunding(params: DepositParams) {
    return {
      function: `${params.vaultAddress}::vault::deposit_into_funding`,
      typeArguments: [],
      functionArguments: [
        params.vaultAddress,
        params.subAddress,
        params.assetMetadata,
        params.amount.toString(),
      ],
    };
  }

  depositIntoFundingWithTransferTo(params: DepositWithTransferParams) {
    return {
      function: `${params.vaultAddress}::vault::deposit_into_funding_with_transfer_to`,
      typeArguments: [],
      functionArguments: [
        params.vaultAddress,
        params.fundingSubAddress,
        params.tradingSubAddress,
        params.assetMetadata,
        params.amount.toString(),
        params.vaultToType,
      ],
    };
  }

  withdrawFromFunding(params: WithdrawParams) {
    return {
      function: `${params.vaultAddress}::vault::withdraw_from_funding`,
      typeArguments: [],
      functionArguments: [
        params.vaultAddress,
        params.subAddress,
        params.assetMetadata,
        params.amount.toString(),
      ],
    };
  }

  transfer(params: TransferParams) {
    return {
      function: `${params.vaultAddress}::vault::transfer`,
      typeArguments: [],
      functionArguments: [
        params.vaultAddress,
        params.vaultFrom,
        params.vaultTo,
        params.amount.toString(),
        params.vaultFromType,
        params.vaultToType,
      ],
    };
  }

  getSubAccs(params: { vaultAddress: string; subAddresses: string[] }) {
    return {
      function: `${params.vaultAddress}::vault::get_sub_accs`,
      typeArguments: [],
      functionArguments: [params.vaultAddress, params.subAddresses],
    };
  }

  getOwnedSubAddresses(params: { vaultAddress: string; rootAddress: string }) {
    return {
      function: `${params.vaultAddress}::vault::get_owned_sub_addresses`,
      typeArguments: [],
      functionArguments: [params.vaultAddress, params.rootAddress],
    };
  }

  createEkidenUser(params: {
    vaultAddress: string;
    fundingLinkProof: Uint8Array;
    crossTradingLinkProof: Uint8Array;
  }) {
    return {
      function: `${params.vaultAddress}::vault::create_ekiden_user`,
      typeArguments: [],
      functionArguments: [
        params.vaultAddress,
        Array.from(params.fundingLinkProof),
        Array.from(params.crossTradingLinkProof),
      ],
    };
  }

  addTradingSubAccount(params: {
    vaultAddress: string;
    linkProof: Uint8Array;
    tradingType: string;
  }) {
    return {
      function: `${params.vaultAddress}::vault::add_trading_sub_account`,
      typeArguments: [],
      functionArguments: [params.vaultAddress, Array.from(params.linkProof), params.tradingType],
    };
  }
}
