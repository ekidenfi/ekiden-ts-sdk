import type { EkidenClientConfig } from "@/core/config";
import type { VaultType } from "@/types/common";

export interface DepositIntoFundingParams {
  rootAddress: string;
  assetMetadata: string;
  amount: bigint;
}

export interface DepositIntoFundingWithTransferToParams {
  rootAddress: string;
  tradingSubAddress: string;
  assetMetadata: string;
  amount: bigint;
  vaultToType: VaultType;
}

export interface WithdrawFromFundingParams {
  rootAddress: string;
  assetMetadata: string;
  amount: bigint;
}

export interface TransferParams {
  vaultFrom: string | null;
  vaultTo: string | null;
  amount: bigint;
  vaultFromType: VaultType;
  vaultToType: VaultType;
}

export interface DepositIntoInsuranceParams {
  amount: bigint;
}

export interface CreateEkidenUserParams {
  fundingLinkProof: Uint8Array;
  crossTradingLinkProof: Uint8Array;
}

export interface CreateAndLinkSubAccountParams {
  linkProof: Uint8Array;
  subAccountType: VaultType;
}

export interface GetSubAccsParams {
  subAddresses: string[];
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
        params.rootAddress,
        params.assetMetadata,
        params.amount.toString(),
      ],
    };
  }

  depositIntoFundingWithTransferTo(params: DepositIntoFundingWithTransferToParams) {
    return {
      function: `${this.contractAddress}::vault::deposit_into_funding_with_transfer_to`,
      typeArguments: [`${this.contractAddress}::vault_types::${params.vaultToType}`],
      functionArguments: [
        params.rootAddress,
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
        params.rootAddress,
        params.assetMetadata,
        params.amount.toString(),
      ],
    };
  }

  transfer(params: TransferParams) {
    return {
      function: `${this.contractAddress}::vault::transfer`,
      typeArguments: [
        `${this.contractAddress}::vault_types::${params.vaultFromType}`,
        `${this.contractAddress}::vault_types::${params.vaultToType}`,
      ],
      functionArguments: [
        params.vaultFrom,
        params.vaultTo,
        params.amount.toString(),
      ],
    };
  }

  depositIntoInsurance(params: DepositIntoInsuranceParams) {
    return {
      function: `${this.contractAddress}::vault::deposit_into_insurance`,
      typeArguments: [],
      functionArguments: [params.amount.toString()],
    };
  }

  createEkidenUser(params: CreateEkidenUserParams) {
    return {
      function: `${this.contractAddress}::user::create_ekiden_user`,
      typeArguments: [],
      functionArguments: [
        Array.from(params.fundingLinkProof),
        Array.from(params.crossTradingLinkProof),
      ],
    };
  }

  createAndLinkSubAccount(params: CreateAndLinkSubAccountParams) {
    return {
      function: `${this.contractAddress}::user::create_and_link_sub_account`,
      typeArguments: [`${this.contractAddress}::vault_types::${params.subAccountType}`],
      functionArguments: [Array.from(params.linkProof)],
    };
  }

  getSubAccs(params: GetSubAccsParams) {
    return {
      function: `${this.contractAddress}::user::get_sub_accs`,
      typeArguments: [],
      functionArguments: [params.subAddresses],
    };
  }

  ownedSubAccs(params: OwnedSubAccsParams) {
    return {
      function: `${this.contractAddress}::user::owned_sub_accs`,
      typeArguments: [],
      functionArguments: [params.ownerAddress],
    };
  }
}
