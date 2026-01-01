import type { EkidenClientConfig } from "@/core/config";
import type { VaultType } from "@/types/common";

export interface DepositIntoFundingParams {
  subAddress: string;
  assetMetadata: string;
  amount: bigint;
}

export interface DepositIntoFundingWithTransferToParams {
  vaultAddress: string;
  fundingSubAddress: string;
  tradingSubAddress: string;
  assetMetadata: string;
  amount: bigint;
  vaultToType: VaultType;
}

export interface WithdrawFromFundingParams {
  subAddress: string;
  assetMetadata: string;
  amount: bigint;
}

export interface TransferParams {
  vaultAddress: string;
  vaultFrom: string | null;
  vaultTo: string | null;
  amount: bigint;
  vaultFromType: VaultType;
  vaultToType: VaultType;
}

export interface DepositIntoInsuranceParams {
  vaultAddress: string;
  subAddresses: string[];
}

export interface CreateEkidenUserParams {
  vaultAddress: string;
  fundingLinkProof: Uint8Array;
  crossTradingLinkProof: Uint8Array;
}

export interface CreateAndLinkSubAccountParams {
  linkProof: Uint8Array;
  subAccountType: VaultType;
}

export interface GetSubAccsParams {
  vaultAddress: string;
  fundingLinkProof: Uint8Array;
  crossTradingLinkProof: Uint8Array;
}

export interface OwnedSubAccsParams {
  ownerAddress: string;
}

export class VaultOnChainClient {
  constructor(private readonly config: EkidenClientConfig) {}

  private get contractAddress(): string {
    return this.config.contractAddress;
  }

  depositIntoFunding(params: DepositIntoFundingParams) {
    return {
      function: `${this.contractAddress}::vault::deposit_into_funding`,
      typeArguments: [],
      functionArguments: [
        params.subAddress,
        params.assetMetadata,
        params.amount.toString(),
      ],
    };
  }

  depositIntoFundingWithTransferTo(params: DepositIntoFundingWithTransferToParams) {
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

  withdrawFromFunding(params: WithdrawFromFundingParams) {
    return {
      function: `${this.contractAddress}::vault::withdraw_from_funding`,
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

  depositIntoInsurance(params: DepositIntoInsuranceParams) {
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

  getSubAccs(params: GetSubAccsParams) {
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
