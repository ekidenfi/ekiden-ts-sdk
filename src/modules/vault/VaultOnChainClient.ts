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
        params.subAddress,
        params.assetMetadata,
        params.amount.toString(),
      ],
    };
  }

  depositIntoFundingWithTransferTo(params: DepositWithTransferParams) {
    return {
      function: `${params.vaultAddress}::vault::deposit_into_funding_with_transfer_to`,
      typeArguments: [`${params.vaultAddress}::vault_types::${params.vaultToType}`],
      functionArguments: [
        params.fundingSubAddress,
        params.tradingSubAddress,
        params.assetMetadata,
        params.amount.toString(),
      ],
    };
  }

  withdrawFromFunding(params: WithdrawParams) {
    return {
      function: `${params.vaultAddress}::vault::withdraw_from_funding`,
      typeArguments: [],
      functionArguments: [
        params.subAddress,
        params.assetMetadata,
        params.amount.toString(),
      ],
    };
  }

  transfer(params: TransferParams) {
    return {
      function: `${params.vaultAddress}::vault::transfer`,
      typeArguments: [
        `${params.vaultAddress}::vault_types::${params.vaultFromType}`,
        `${params.vaultAddress}::vault_types::${params.vaultToType}`,
      ],
      functionArguments: [
        params.vaultFrom ? [params.vaultFrom] : [],
        params.vaultTo ? [params.vaultTo] : [],
        params.amount.toString(),
      ],
    };
  }

  getSubAccs(params: { vaultAddress: string; subAddresses: string[] }) {
    return {
      function: `${params.vaultAddress}::user::get_sub_accs`,
      typeArguments: [],
      functionArguments: [params.subAddresses],
    };
  }

  ownedSubAccs(params: { vaultAddress: string; userAddress: string }) {
    return {
      function: `${params.vaultAddress}::user::owned_sub_accs`,
      typeArguments: [],
      functionArguments: [params.userAddress],
    };
  }

  createEkidenUser(params: {
    vaultAddress: string;
    fundingLinkProof: Uint8Array;
    crossTradingLinkProof: Uint8Array;
  }) {
    return {
      function: `${params.vaultAddress}::user::create_ekiden_user`,
      typeArguments: [],
      functionArguments: [
        Array.from(params.fundingLinkProof),
        Array.from(params.crossTradingLinkProof),
      ],
    };
  }

  createAndLinkSubAccount(params: {
    vaultAddress: string;
    linkProof: Uint8Array;
    subAccountType?: string;
  }) {
    const type = params.subAccountType || "Cross";
    return {
      function: `${params.vaultAddress}::user::create_and_link_sub_account`,
      typeArguments: [`${params.vaultAddress}::vault_types::${type}`],
      functionArguments: [Array.from(params.linkProof)],
    };
  }
}
