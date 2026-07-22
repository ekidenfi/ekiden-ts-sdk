import type {
	CantonConfig,
	CantonDisclosedContract,
	TransferFactoryResult,
	TransferOfferAcceptContext,
} from "./types";

const readObj = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== "object") return {};
	return value as Record<string, unknown>;
};

export interface FetchTransferFactoryParams {
	sender: string;
	receiver: string;
	amount: string;
	inputHoldingCids: string[];
	requestedAt?: string;
	executeBefore?: string;
}

const defaultExecuteBefore = (): string => new Date(Date.now() + 60 * 60 * 1000).toISOString();

/**
 * Client for the utility registry (token registrar) API.
 * Resolves transfer factories and choice contexts needed to build
 * deposit/withdraw/accept commands.
 */
export class CantonRegistryClient {
	constructor(
		private readonly config: Pick<
			CantonConfig,
			"utilityRegistryBaseUrl" | "instrumentAdmin" | "instrumentId" | "synchronizerId"
		>
	) {}

	private get baseUrl(): string {
		return this.config.utilityRegistryBaseUrl.replace(/\/$/, "");
	}

	private normalizeDisclosedContracts(value: unknown): CantonDisclosedContract[] {
		const contracts = Array.isArray(value) ? value : [];
		return contracts
			.map((entry) => {
				const contract = readObj(entry);
				const templateId = String(contract.templateId || "");
				const contractId = String(contract.contractId || "");
				const createdEventBlob = String(contract.createdEventBlob || "");
				if (!templateId || !contractId || !createdEventBlob) {
					return null;
				}
				return {
					templateId,
					contractId,
					createdEventBlob,
					synchronizerId: String(contract.synchronizerId || this.config.synchronizerId),
				};
			})
			.filter((contract): contract is CantonDisclosedContract => contract != null);
	}

	async fetchTransferFactory({
		sender,
		receiver,
		amount,
		inputHoldingCids,
		requestedAt = new Date().toISOString(),
		executeBefore = defaultExecuteBefore(),
	}: FetchTransferFactoryParams): Promise<TransferFactoryResult> {
		if (!inputHoldingCids.length) {
			throw new Error("At least one holding CID is required to fetch a transfer factory");
		}

		const response = await fetch(
			`${this.baseUrl}/registry/transfer-instruction/v1/transfer-factory`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					choiceArguments: {
						expectedAdmin: this.config.instrumentAdmin,
						transfer: {
							sender,
							receiver,
							amount,
							instrumentId: {
								admin: this.config.instrumentAdmin,
								id: this.config.instrumentId,
							},
							lock: null,
							requestedAt,
							executeBefore,
							inputHoldingCids,
							meta: { values: {} },
						},
						extraArgs: { context: { values: {} }, meta: { values: {} } },
					},
					excludeDebugFields: true,
				}),
			}
		);

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(`Failed to fetch transfer factory (${response.status}): ${errorBody}`);
		}

		const payload = readObj(await response.json());
		const factoryId = String(payload.factoryId || "");
		const transferKind = String(payload.transferKind || "") as "direct" | "offer";
		const choiceContext = readObj(payload.choiceContext);
		const choiceContextData = readObj(choiceContext.choiceContextData);

		if (!factoryId) {
			throw new Error("Transfer factory response is missing factoryId");
		}

		return {
			factoryId,
			transferKind,
			transferExtraArgs: {
				context: { values: readObj(choiceContextData.values) },
				meta: { values: {} },
			},
			disclosedContracts: this.normalizeDisclosedContracts(choiceContext.disclosedContracts),
		};
	}

	async fetchTransferOfferAcceptContext(contractId: string): Promise<TransferOfferAcceptContext> {
		const response = await fetch(
			`${this.baseUrl}/registry/transfer-instruction/v1/${encodeURIComponent(contractId)}/choice-contexts/accept`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ meta: {} }),
			}
		);

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`Failed to fetch transfer offer accept context (${response.status}): ${errorBody}`
			);
		}

		const payload = readObj(await response.json());
		const choiceContext = readObj(payload.choiceContext ?? payload);
		const choiceContextData = readObj(
			choiceContext.choiceContextData ?? payload.choiceContextData
		);

		let values: Record<string, unknown>;
		if (choiceContextData.values && typeof choiceContextData.values === "object") {
			values = readObj(choiceContextData.values);
		} else if (choiceContextData.value && typeof choiceContextData.value === "object") {
			values = readObj(choiceContextData.value);
		} else {
			values = choiceContextData;
		}

		return {
			extraArgs: {
				context: { values },
				meta: { values: {} },
			},
			disclosedContracts: this.normalizeDisclosedContracts(
				choiceContext.disclosedContracts ?? payload.disclosedContracts
			),
		};
	}
}
