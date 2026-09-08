/**
 * Deployment-specific Canton configuration.
 * All values are provided by the SDK consumer (they change per environment/deploy).
 */
export interface CantonConfig {
	/** Ekiden DAML package id */
	packageId: string;
	/**
	 * Package-name form for gateway template filters (e.g. `#ekiden-daml-contracts-v15`).
	 * Required for ecosystem rewards config/distribution ACS lookups.
	 */
	packageName?: string;
	/** Ekiden `User:User` contract id */
	userContractCid: string;
	/** Created-event blob of the Ekiden `User:User` contract (for disclosure) */
	userContractEventBlob: string;
	/** Canton synchronizer (domain) id */
	synchronizerId: string;
	/** Ekiden platform admin party id */
	adminPartyId: string;
	/** Instrument admin party id (e.g. USDCx interchain representative) */
	instrumentAdmin: string;
	/** Instrument id (e.g. "USDCx") */
	instrumentId: string;
	/** Base URL of the utility registry API for this instrument admin */
	utilityRegistryBaseUrl: string;
	/** Operator party for transfer preapprovals */
	quoteAssetOperator: string;
	/** Transfer preapproval template id (package-qualified or "#package-name" form) */
	transferPreapprovalTemplateId: string;
	/** Defaults to the utility-registry-app-v0 TransferOffer template */
	transferOfferTemplateId?: string;
	/** Defaults to the splice token-standard TransferInstruction interface */
	transferInstructionInterfaceTemplateId?: string;
	/** Defaults to the splice token-standard TransferFactory interface */
	transferFactoryInterfaceTemplateId?: string;
	/**
	 * Canton Gateway base URL (…/v1). When set, User choices auto-attach
	 * `ecosystemRewards` from ACS config + distributor holdings, and
	 * deposit/withdraw auto-attach `FundingTransferFeeConfig`.
	 */
	gatewayBaseUrl?: string;
	/** Bridge onboarding parties; required only for bridge onboarding commands */
	bridge?: CantonBridgeConfig;
}

/** Logical reward funds (matches Daml `EcosystemFundKind`). */
export type EcosystemFundKind = "DevFund" | "GrowthFund" | "UserRewardFund" | "MarketMakingFund";

/** User/platform action that triggers distribute (matches Daml `EcosystemRewardAction`). */
export type EcosystemRewardAction =
	| "RewardAction_CreateUser"
	| "RewardAction_CreateSubAccountWithVault"
	| "RewardAction_DepositIntoFunding"
	| "RewardAction_DepositIntoFundingWithTransferRequest"
	| "RewardAction_WithdrawFromFunding"
	| "RewardAction_CreateTransferRequest"
	| "RewardAction_CreateWithdrawalRequest"
	| "RewardAction_SettleBatch"
	| "RewardAction_SettleBatchWithMaybeMarketUpdate";

export interface HoldingInstrumentId {
	admin: string;
	id: string;
}

export interface CantonBridgeConfig {
	crossChainRepresentative: string;
	operatorPartyId: string;
	bridgeOperatorPartyId: string;
	/** Defaults to the utility-bridge-v0 BridgeUserAgreementRequest template */
	userAgreementRequestTemplate?: string;
}

export interface CantonDisclosedContract {
	templateId: string;
	contractId: string;
	createdEventBlob: string;
	synchronizerId: string;
}

export interface CantonExerciseCommand {
	ExerciseCommand: {
		templateId: string;
		contractId: string;
		choice: string;
		choiceArgument: Record<string, unknown>;
	};
}

export interface CantonCreateCommand {
	CreateCommand: {
		templateId: string;
		createArguments: Record<string, unknown>;
	};
}

export type CantonCommand = CantonExerciseCommand | CantonCreateCommand;

/** JSON body accepted by the validator command submission endpoint */
export interface CantonCommandBatch {
	commandId: string;
	actAs: string[];
	commands: CantonCommand[];
	disclosedContracts?: CantonDisclosedContract[];
	synchronizerId?: string;
}

/** Token holding UTXO, as returned by a gateway/wallet holdings lookup */
export interface CantonHolding {
	contractId: string;
	amount: string;
	createdEventBlob: string;
	templateId: string;
	provider: string;
}

export interface TransferExtraArgs {
	context: { values: Record<string, unknown> };
	meta: { values: Record<string, unknown> };
}

export interface RewardDistributionInput {
	instrumentId: HoldingInstrumentId;
	/** Ledger JSON API enum encoding — plain string, not `{ tag, value }`. */
	fund: EcosystemFundKind;
	holdings: string[];
	transferFactoryCid: string;
	transferExtraArgs: TransferExtraArgs;
	transferMeta: { values: Record<string, unknown> };
}

/** Optional CIP-56 inputs for nested distribute from User choices. */
export interface EcosystemRewardsHook {
	distributionCid: string;
	inputs: RewardDistributionInput[];
}

/**
 * Live `FundingFee:FundingTransferFeeConfig` from gateway ACS.
 * Cents fields match on-ledger; `depositFee` / `withdrawFee` are Decimal strings.
 */
export interface FundingTransferFeeConfig {
	contractId: string;
	templateId: string;
	createdEventBlob: string;
	synchronizerId: string;
	platform: string;
	bank: string;
	feeReceiver: string;
	depositFeeCents: number;
	withdrawFeeCents: number;
	/** Decimal string (`cents / 100`), for CIP-56 transfer sizing */
	depositFee: string;
	/** Decimal string (`cents / 100`), for vault debit checks */
	withdrawFee: string;
}

/** UI-facing funding fee quote (no ledger blobs / contract ids). */
export interface FundingFees {
	/** Flat deposit fee as Decimal string (e.g. `"0.5"`) */
	depositFee: string;
	/** Flat withdraw fee as Decimal string (e.g. `"0.5"`) */
	withdrawFee: string;
	depositFeeCents: number;
	withdrawFeeCents: number;
}

export interface TransferFactoryResult {
	factoryId: string;
	transferKind: "direct" | "offer";
	transferExtraArgs: TransferExtraArgs;
	disclosedContracts: CantonDisclosedContract[];
}

export interface TransferOfferAcceptContext {
	extraArgs: TransferExtraArgs;
	disclosedContracts: CantonDisclosedContract[];
}

export interface TransferInstructionPayload {
	sender: string;
	receiver: string;
	amount: string;
	executeBefore: string;
	provider: string;
}

export interface CantonTransferOffer {
	contractId: string;
	templateId: string;
	amount: string;
	sender: string;
	receiver: string;
	provider: string;
	createdAt: string;
}

export interface CantonTransferPreapproval {
	contractId: string;
	createdEventBlob: string;
}

export interface CantonSubmitResponse {
	updateId?: string;
	completionOffset?: number;
	response?: string;
	error?: string;
	message?: string;
	[key: string]: unknown;
}
