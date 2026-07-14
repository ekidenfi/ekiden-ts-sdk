import type {
	CantonHolding,
	CantonTransferOffer,
	CantonTransferPreapproval,
	TransferInstructionPayload,
} from "./types";

const readObj = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== "object") return {};
	return value as Record<string, unknown>;
};

/**
 * Extract the created event from an active-contract entry.
 * Supports the different response shapes of the Canton JSON API,
 * gateway `/getContracts` and console wallet lookups.
 */
export const extractActiveContractCreatedEvent = (
	entry: Record<string, unknown>
): Record<string, unknown> => {
	if (entry.createdEvent && typeof entry.createdEvent === "object") {
		return readObj(entry.createdEvent);
	}
	if (entry.activeContract && typeof entry.activeContract === "object") {
		const activeContract = readObj(entry.activeContract);
		if (activeContract.createdEvent) {
			return readObj(activeContract.createdEvent);
		}
		return activeContract;
	}
	if (entry.contractEntry && typeof entry.contractEntry === "object") {
		const contractEntry = readObj(entry.contractEntry);
		if (contractEntry.activeContract) {
			return readObj(readObj(contractEntry.activeContract).createdEvent);
		}
		if (contractEntry.JsActiveContract) {
			const activeContract = readObj(contractEntry.JsActiveContract);
			if (activeContract.createdEvent) {
				return readObj(activeContract.createdEvent);
			}
			return activeContract;
		}
	}
	if (entry.contractId && entry.templateId) {
		return entry;
	}
	return {};
};

type DamlField = {
	label?: string;
	value?: Record<string, unknown>;
};

const readDamlFields = (value: unknown): DamlField[] => {
	const fields = readObj(value).fields;
	if (!Array.isArray(fields)) return [];
	return fields.map((field) => readObj(field) as DamlField);
};

const readDamlFieldValue = (
	fields: DamlField[],
	label: string
): Record<string, unknown> | undefined => {
	const field = fields.find((entry) => entry.label === label);
	return field?.value ? readObj(field.value) : undefined;
};

const readDamlParty = (value: Record<string, unknown> | undefined): string => {
	if (!value) return "";
	return String(value.party || "");
};

const readDamlNumeric = (value: Record<string, unknown> | undefined): string => {
	if (!value) return "0";
	if ("numeric" in value) return String(value.numeric || "0");
	if ("int64" in value) return String(value.int64 || "0");
	return "0";
};

const readDamlTimestamp = (value: Record<string, unknown> | undefined): string => {
	if (!value) return "";
	if ("timestamp" in value) return String(value.timestamp || "");
	if ("text" in value) return String(value.text || "");
	return "";
};

const readDamlRecordFields = (value: Record<string, unknown> | undefined): DamlField[] => {
	if (!value) return [];
	return readDamlFields(readObj(value.record ?? value));
};

const readTransferFromDamlFields = (
	fields: DamlField[]
): TransferInstructionPayload | undefined => {
	const transferValue = readDamlFieldValue(fields, "transfer");
	const transferFields = readDamlRecordFields(transferValue);
	if (!transferFields.length) return undefined;

	return {
		sender: readDamlParty(readDamlFieldValue(transferFields, "sender")),
		receiver: readDamlParty(readDamlFieldValue(transferFields, "receiver")),
		amount: readDamlNumeric(readDamlFieldValue(transferFields, "amount")),
		executeBefore: readDamlTimestamp(readDamlFieldValue(transferFields, "executeBefore")),
	};
};

export const extractTransferInstructionFromCreateArgument = (
	createArgument: Record<string, unknown>
): TransferInstructionPayload | undefined => {
	const instruction = readObj(createArgument.instruction);
	if (instruction.receiver || instruction.sender) {
		return {
			sender: String(instruction.sender || createArgument.sender || ""),
			receiver: String(instruction.receiver || createArgument.receiver || ""),
			amount: String(instruction.amount || createArgument.amount || "0"),
			executeBefore: String(instruction.executeBefore || createArgument.executeBefore || ""),
		};
	}

	const directTransfer = readObj(createArgument.transfer);
	if (directTransfer.receiver || directTransfer.sender) {
		return {
			sender: String(directTransfer.sender || ""),
			receiver: String(directTransfer.receiver || ""),
			amount: String(directTransfer.amount || "0"),
			executeBefore: String(directTransfer.executeBefore || ""),
		};
	}

	const rootFields = readDamlFields(createArgument);
	const transferFromRoot = readTransferFromDamlFields(rootFields);
	if (transferFromRoot?.receiver || transferFromRoot?.sender) {
		return transferFromRoot;
	}

	const instructionValue = readDamlFieldValue(rootFields, "instruction");
	const instructionFields = readDamlRecordFields(instructionValue);
	const transferFromInstruction = readTransferFromDamlFields(instructionFields);
	if (transferFromInstruction?.receiver || transferFromInstruction?.sender) {
		return transferFromInstruction;
	}

	const rootReceiver = readDamlParty(readDamlFieldValue(rootFields, "receiver"));
	if (rootReceiver) {
		return {
			sender: readDamlParty(readDamlFieldValue(rootFields, "sender")),
			receiver: rootReceiver,
			amount: readDamlNumeric(readDamlFieldValue(rootFields, "amount")),
			executeBefore: readDamlTimestamp(readDamlFieldValue(rootFields, "executeBefore")),
		};
	}

	return undefined;
};

export const findCreateArgumentReceiver = (
	createArgument: Record<string, unknown>,
	partyId: string
): boolean => {
	const transfer = extractTransferInstructionFromCreateArgument(createArgument);
	if (transfer?.receiver) {
		return transfer.receiver === partyId;
	}

	if ("receiver" in createArgument) {
		return String(createArgument.receiver || "") === partyId;
	}

	const fields = createArgument.fields;
	if (!Array.isArray(fields)) return false;

	return fields.some(
		(field: { value?: { party?: string }; label?: string }) =>
			field.value?.party === partyId && field.label === "receiver"
	);
};

export const isTransferOfferExpired = (executeBefore: string, now = Date.now()): boolean => {
	if (!executeBefore.trim()) return false;

	return Number(executeBefore) / 1000 <= now;
};

/** Map raw active-contract entries to non-expired transfer offers for a party */
export const findTransferOffersInContracts = (
	contracts: Record<string, unknown>[],
	partyId: string
): CantonTransferOffer[] => {
	const offers: CantonTransferOffer[] = [];

	for (const contract of contracts) {
		const createdEvent = extractActiveContractCreatedEvent(contract);
		const createArgument = readObj(createdEvent.createArgument);
		const transfer = extractTransferInstructionFromCreateArgument(createArgument);
		if (
			!transfer ||
			transfer.receiver !== partyId ||
			isTransferOfferExpired(transfer.executeBefore)
		) {
			continue;
		}

		const contractId = String(createdEvent.contractId || "");
		const templateId = String(createdEvent.templateId || "");
		if (!contractId || !templateId) continue;

		offers.push({
			contractId,
			templateId,
			amount: transfer.amount,
			sender: transfer.sender,
			receiver: transfer.receiver,
			createdAt: String(createdEvent.createdAt || ""),
		});
	}

	offers.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
	return offers;
};

/** Find a transfer preapproval owned by a party among raw active-contract entries */
export const findTransferPreapprovalInContracts = (
	contracts: Record<string, unknown>[],
	partyId: string
): CantonTransferPreapproval | undefined => {
	for (const contract of contracts) {
		const createdEvent = extractActiveContractCreatedEvent(contract);
		const createArgument = createdEvent.createArgument;
		if (!createArgument || typeof createArgument !== "object") continue;

		if (!findCreateArgumentReceiver(createArgument as Record<string, unknown>, partyId)) {
			continue;
		}

		const contractId = String(createdEvent.contractId || "");
		const createdEventBlob = String(createdEvent.createdEventBlob || "");
		if (!contractId || !createdEventBlob) continue;

		return { contractId, createdEventBlob };
	}

	return undefined;
};

/** Map raw active-contract entries to token holdings owned by a party */
export const findHoldingsInContracts = (
	contracts: Record<string, unknown>[],
	partyId: string
): CantonHolding[] => {
	const holdings: CantonHolding[] = [];

	for (const contract of contracts) {
		const createdEvent = extractActiveContractCreatedEvent(contract);
		const contractId = String(createdEvent.contractId || "");
		if (!contractId) continue;

		const createArgument = readObj(createdEvent.createArgument);
		const owner = String(createArgument.owner || "");
		if (owner && owner !== partyId) continue;

		const templateId = String(createdEvent.templateId || "");
		if (!templateId) continue;

		holdings.push({
			contractId,
			amount: String(createArgument.amount || "0"),
			createdEventBlob: String(createdEvent.createdEventBlob || ""),
			templateId,
		});
	}

	return holdings;
};
