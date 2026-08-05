import { resolveEcosystemRewardsHook } from "./ecosystemRewards";
import type { CantonGatewayClient } from "./gateway";
import type { CantonRegistryClient } from "./registry";
import type {
	CantonCommandBatch,
	CantonConfig,
	CantonDisclosedContract,
	CantonHolding,
	EcosystemRewardAction,
	EcosystemRewardsHook,
	TransferFactoryResult,
	TransferOfferAcceptContext,
} from "./types";

const DEFAULT_TRANSFER_INSTRUCTION_INTERFACE_TEMPLATE_ID =
	"#splice-api-token-transfer-instruction-v1:Splice.Api.Token.TransferInstructionV1:TransferInstruction";
const DEFAULT_BRIDGE_USER_AGREEMENT_REQUEST_TEMPLATE =
	"#utility-bridge-v0:Utility.Bridge.V0.Agreement.User:BridgeUserAgreementRequest";

const commandId = (name: string): string => `${name}-${Math.floor(Date.now() / 1000)}`;

export const mergeDisclosedContracts = (
	...groups: CantonDisclosedContract[][]
): CantonDisclosedContract[] => {
	const seen = new Set<string>();
	const merged: CantonDisclosedContract[] = [];

	for (const group of groups) {
		for (const contract of group) {
			if (seen.has(contract.contractId)) continue;
			seen.add(contract.contractId);
			merged.push(contract);
		}
	}

	return merged;
};

export type SubAccountType = "STFunding" | "STCrossTrading" | "STIsolatedTrading";

export interface RegisterUserParams {
	partyId: string;
	displayName?: string;
}

export interface CreateSubAccountWithVaultParams {
	partyId: string;
	/** `User:EkidenUser` contract id of this party (from gateway `/account` or `/getContracts`) */
	ekidenUserCid: string;
	subType?: SubAccountType;
}

export interface DepositIntoFundingParams {
	partyId: string;
	amount: string;
	/** Existing `User:FundingVault` contract id, if the party already has one */
	fundingVaultCid?: string;
	/** Client USDCx holding UTXO contract ids */
	holdingCids: string[];
	/** Result of a transfer-factory lookup (see `fetchTransferFactory`) */
	transferFactory: TransferFactoryResult;
}

export interface DepositIntoFundingWithTransferRequestParams {
	partyId: string;
	amount: string;
	fundingVaultCid: string;
	tradingVaultCid: string;
	holdingCids: string[];
	transferFactory: TransferFactoryResult;
}

export interface CreateTransferRequestParams {
	partyId: string;
	amount: string;
	fundingVaultCid: string;
	tradingVaultCid: string;
}

export interface CreateWithdrawalRequestParams {
	partyId: string;
	requestedAmount: string;
	fundingVaultCid: string;
	tradingVaultCid: string;
	withdrawAvailable?: boolean;
}

export interface WithdrawFromFundingParams {
	partyId: string;
	amount: string;
	fundingVaultCid: string;
	/** Platform (admin party) holdings, disclosed to the user for the payout */
	bankHoldings: CantonHolding[];
	transferFactory: TransferFactoryResult;
}

export interface ArchivePreapproveTransfersParams {
	partyId: string;
	contractId: string;
}

export interface AcceptTransferOfferParams {
	partyId: string;
	contractId: string;
	/** Result of an accept-context lookup (see `fetchTransferOfferAcceptContext`) */
	acceptContext: TransferOfferAcceptContext;
}

/**
 * Builders for Canton (DAML) command batches.
 *
 * Ledger state for deposits/withdrawals (vault/holding ids) must be provided by the
 * caller. Ecosystem rewards hooks are resolved internally from Canton Gateway ACS
 * when configured — callers cannot omit `ecosystemRewards` on User choices.
 */
export class CantonCommands {
	constructor(
		private readonly config: CantonConfig,
		private readonly registry?: CantonRegistryClient,
		private readonly gateway?: CantonGatewayClient
	) {}

	private get userTemplateId(): string {
		return `${this.config.packageId}:User:User`;
	}

	get ekidenUserTemplateId(): string {
		return `${this.config.packageId}:User:EkidenUser`;
	}

	get fundingVaultTemplateId(): string {
		return `${this.config.packageId}:User:FundingVault`;
	}

	private get transferInstructionInterfaceTemplateId(): string {
		return (
			this.config.transferInstructionInterfaceTemplateId ||
			DEFAULT_TRANSFER_INSTRUCTION_INTERFACE_TEMPLATE_ID
		);
	}

	/** Disclosure of the Ekiden `User:User` contract, required by most choices */
	buildUserDisclosedContract(): CantonDisclosedContract {
		return {
			templateId: this.userTemplateId,
			contractId: this.config.userContractCid,
			createdEventBlob: this.config.userContractEventBlob,
			synchronizerId: this.config.synchronizerId,
		};
	}

	private async attachEcosystemRewards(action: EcosystemRewardAction): Promise<{
		ecosystemRewards: EcosystemRewardsHook | null;
		disclosedContracts: CantonDisclosedContract[];
	}> {
		if (!this.registry) {
			return { ecosystemRewards: null, disclosedContracts: [] };
		}

		const { hook, disclosedContracts } = await resolveEcosystemRewardsHook({
			config: this.config,
			gateway: this.gateway,
			registry: this.registry,
			action,
		});
		return {
			ecosystemRewards: hook,
			disclosedContracts,
		};
	}

	private exerciseUserChoice(
		name: string,
		partyId: string,
		choice: string,
		choiceArgument: Record<string, unknown>,
		disclosedContracts?: CantonDisclosedContract[]
	): CantonCommandBatch {
		return {
			commandId: commandId(name),
			actAs: [partyId],
			commands: [
				{
					ExerciseCommand: {
						templateId: this.userTemplateId,
						contractId: this.config.userContractCid,
						choice,
						choiceArgument,
					},
				},
			],
			disclosedContracts: disclosedContracts ?? [this.buildUserDisclosedContract()],
		};
	}

	async registerUser({
		partyId,
		displayName = "Ekiden User",
	}: RegisterUserParams): Promise<CantonCommandBatch> {
		const rewards = await this.attachEcosystemRewards("RewardAction_CreateUser");
		return this.exerciseUserChoice(
			"create-ekiden-user",
			partyId,
			"CreateEkidenUser",
			{
				user: partyId,
				displayName,
				ecosystemRewards: rewards.ecosystemRewards,
			},
			mergeDisclosedContracts([this.buildUserDisclosedContract()], rewards.disclosedContracts)
		);
	}

	async createSubAccountWithVault({
		partyId,
		ekidenUserCid,
		subType = "STCrossTrading",
	}: CreateSubAccountWithVaultParams): Promise<CantonCommandBatch> {
		const rewards = await this.attachEcosystemRewards("RewardAction_CreateSubAccountWithVault");
		return this.exerciseUserChoice(
			"create-sub-account-with-vault",
			partyId,
			"CreateSubAccountWithVault",
			{
				user: partyId,
				ekidenUser: ekidenUserCid,
				subType: { tag: subType, value: {} },
				ecosystemRewards: rewards.ecosystemRewards,
			},
			mergeDisclosedContracts([this.buildUserDisclosedContract()], rewards.disclosedContracts)
		);
	}

	async depositIntoFunding({
		partyId,
		amount,
		fundingVaultCid,
		holdingCids,
		transferFactory,
	}: DepositIntoFundingParams): Promise<CantonCommandBatch> {
		if (!holdingCids.length) {
			throw new Error("At least one holding CID is required for a funding deposit");
		}
		if (transferFactory.transferKind !== "direct") {
			throw new Error(
				"Direct transfer is required for funding deposit; enable platform transfer preapproval"
			);
		}

		const rewards = await this.attachEcosystemRewards("RewardAction_DepositIntoFunding");

		return this.exerciseUserChoice(
			"fund-funding-account",
			partyId,
			"DepositIntoFunding",
			{
				user: partyId,
				fundingVault: fundingVaultCid,
				amount,
				clientHoldings: holdingCids,
				transferFactoryCid: transferFactory.factoryId,
				transferExtraArgs: transferFactory.transferExtraArgs,
				transferMeta: { values: {} },
				ecosystemRewards: rewards.ecosystemRewards,
			},
			mergeDisclosedContracts(
				[this.buildUserDisclosedContract()],
				transferFactory.disclosedContracts,
				rewards.disclosedContracts
			)
		);
	}

	async depositIntoFundingWithTransferRequest({
		partyId,
		amount,
		fundingVaultCid,
		tradingVaultCid,
		holdingCids,
		transferFactory,
	}: DepositIntoFundingWithTransferRequestParams): Promise<CantonCommandBatch> {
		if (!holdingCids.length) {
			throw new Error("At least one holding CID is required for a deposit");
		}
		if (transferFactory.transferKind !== "direct") {
			throw new Error(
				"Direct transfer is required for deposit; enable platform transfer preapproval"
			);
		}

		const rewards = await this.attachEcosystemRewards(
			"RewardAction_DepositIntoFundingWithTransferRequest"
		);

		return this.exerciseUserChoice(
			"deposit-into-funding-with-transfer-request",
			partyId,
			"DepositIntoFundingWithTransferRequest",
			{
				user: partyId,
				fundingVault: fundingVaultCid,
				tradingVault: tradingVaultCid,
				amount,
				clientHoldings: holdingCids,
				transferFactoryCid: transferFactory.factoryId,
				transferExtraArgs: transferFactory.transferExtraArgs,
				transferMeta: { values: {} },
				ecosystemRewards: rewards.ecosystemRewards,
			},
			mergeDisclosedContracts(
				[this.buildUserDisclosedContract()],
				transferFactory.disclosedContracts,
				rewards.disclosedContracts
			)
		);
	}

	/** Propose moving funds from the funding vault into a trading vault */
	async createTransferRequest({
		partyId,
		amount,
		fundingVaultCid,
		tradingVaultCid,
	}: CreateTransferRequestParams): Promise<CantonCommandBatch> {
		const rewards = await this.attachEcosystemRewards("RewardAction_CreateTransferRequest");
		return this.exerciseUserChoice(
			"propose-transfer-to-trading",
			partyId,
			"CreateTransferRequest",
			{
				user: partyId,
				fundingVault: fundingVaultCid,
				tradingVault: tradingVaultCid,
				amount,
				ecosystemRewards: rewards.ecosystemRewards,
			},
			mergeDisclosedContracts([this.buildUserDisclosedContract()], rewards.disclosedContracts)
		);
	}

	async createWithdrawalRequest({
		partyId,
		requestedAmount,
		fundingVaultCid,
		tradingVaultCid,
		withdrawAvailable = true,
	}: CreateWithdrawalRequestParams): Promise<CantonCommandBatch> {
		const rewards = await this.attachEcosystemRewards("RewardAction_CreateWithdrawalRequest");
		return this.exerciseUserChoice(
			"create-withdrawal-request",
			partyId,
			"CreateWithdrawalRequest",
			{
				user: partyId,
				fundingVault: fundingVaultCid,
				tradingVault: tradingVaultCid,
				requestedAmount,
				withdrawAvailable,
				ecosystemRewards: rewards.ecosystemRewards,
			},
			mergeDisclosedContracts([this.buildUserDisclosedContract()], rewards.disclosedContracts)
		);
	}

	async withdrawFromFunding({
		partyId,
		amount,
		fundingVaultCid,
		bankHoldings,
		transferFactory,
	}: WithdrawFromFundingParams): Promise<CantonCommandBatch> {
		if (!bankHoldings.length) {
			throw new Error("No bank holdings provided for withdrawal");
		}
		if (transferFactory.transferKind !== "direct") {
			throw new Error(
				"Direct transfer is required for withdrawal; enable transfer preapproval first"
			);
		}

		const rewards = await this.attachEcosystemRewards("RewardAction_WithdrawFromFunding");

		return this.exerciseUserChoice(
			"withdraw-from-funding",
			partyId,
			"WithdrawFromFunding",
			{
				user: partyId,
				fundingVault: fundingVaultCid,
				amount,
				bankHoldings: bankHoldings.map((holding) => holding.contractId),
				transferFactoryCid: transferFactory.factoryId,
				transferExtraArgs: transferFactory.transferExtraArgs,
				transferMeta: { values: {} },
				ecosystemRewards: rewards.ecosystemRewards,
			},
			mergeDisclosedContracts(
				[this.buildUserDisclosedContract()],
				transferFactory.disclosedContracts,
				bankHoldings.map((holding) => ({
					templateId: holding.templateId,
					contractId: holding.contractId,
					createdEventBlob: holding.createdEventBlob,
					synchronizerId: this.config.synchronizerId,
				})),
				rewards.disclosedContracts
			)
		);
	}

	createPreapproveTransfers({ partyId }: { partyId: string }): CantonCommandBatch {
		return {
			commandId: commandId("preapprove-transfers"),
			actAs: [partyId],
			commands: [
				{
					CreateCommand: {
						templateId: this.config.transferPreapprovalTemplateId,
						createArguments: {
							operator: this.config.quoteAssetOperator,
							receiver: partyId,
							instrumentAdmin: this.config.instrumentAdmin,
							instrumentAllowances: [{ id: this.config.instrumentId }],
						},
					},
				},
			],
			synchronizerId: this.config.synchronizerId,
		};
	}

	archivePreapproveTransfers({
		partyId,
		contractId,
	}: ArchivePreapproveTransfersParams): CantonCommandBatch {
		return {
			commandId: commandId("archive-preapprove-transfers"),
			actAs: [partyId],
			commands: [
				{
					ExerciseCommand: {
						templateId: this.config.transferPreapprovalTemplateId,
						contractId,
						choice: "Archive",
						choiceArgument: {},
					},
				},
			],
			synchronizerId: this.config.synchronizerId,
		};
	}

	acceptTransferOffer({
		partyId,
		contractId,
		acceptContext,
	}: AcceptTransferOfferParams): CantonCommandBatch {
		return {
			commandId: commandId("accept-transfer-offer"),
			actAs: [partyId],
			commands: [
				{
					ExerciseCommand: {
						templateId: this.transferInstructionInterfaceTemplateId,
						contractId,
						choice: "TransferInstruction_Accept",
						choiceArgument: {
							extraArgs: acceptContext.extraArgs,
						},
					},
				},
			],
			disclosedContracts: acceptContext.disclosedContracts,
			synchronizerId: this.config.synchronizerId,
		};
	}

	createBridgeUserAgreementRequest({ partyId }: { partyId: string }): CantonCommandBatch {
		const bridge = this.config.bridge;
		if (!bridge) {
			throw new Error("Bridge config is required for bridge onboarding commands");
		}

		return {
			commandId: commandId("create-bridge-user-agreement-request"),
			actAs: [partyId],
			commands: [
				{
					CreateCommand: {
						templateId:
							bridge.userAgreementRequestTemplate ||
							DEFAULT_BRIDGE_USER_AGREEMENT_REQUEST_TEMPLATE,
						createArguments: {
							crossChainRepresentative: bridge.crossChainRepresentative,
							operator: bridge.operatorPartyId,
							bridgeOperator: bridge.bridgeOperatorPartyId,
							user: partyId,
							instrumentId: {
								admin: this.config.instrumentAdmin,
								id: this.config.instrumentId,
							},
							preApproval: true,
						},
					},
				},
			],
		};
	}
}
