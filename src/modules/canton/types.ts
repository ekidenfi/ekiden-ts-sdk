/**
 * Deployment-specific Canton configuration.
 * All values are provided by the SDK consumer (they change per environment/deploy).
 */
export interface CantonConfig {
	/** Ekiden DAML package id */
	packageId: string;
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
	/** Bridge onboarding parties; required only for bridge onboarding commands */
	bridge?: CantonBridgeConfig;
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
}

export interface TransferExtraArgs {
	context: { values: Record<string, unknown> };
	meta: { values: Record<string, unknown> };
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
}

export interface CantonTransferOffer {
	contractId: string;
	templateId: string;
	amount: string;
	sender: string;
	receiver: string;
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
