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
	if (typeof value.party === "string") return value.party;
	if (typeof value.text === "string" && value.text.includes("::")) return value.text;
	return "";
};

const readDamlNumeric = (value: Record<string, unknown> | undefined): string => {
	if (!value) return "0";
	if ("numeric" in value) return String(value.numeric || "0");
	if ("int64" in value) return String(value.int64 || "0");
	if (typeof value.text === "string" && value.text.trim()) return value.text;
	return "0";
};

const readDamlTimestamp = (value: Record<string, unknown> | undefined): string => {
	if (!value) return "";
	if ("timestamp" in value) return String(value.timestamp || "");
	if ("text" in value) return String(value.text || "");
	return "";
};

const readPartyLike = (value: unknown): string => {
	if (typeof value === "string") return value;
	if (value && typeof value === "object") {
		return readDamlParty(value as Record<string, unknown>);
	}
	return "";
};

const readAmountLike = (value: unknown): string => {
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	if (typeof value === "string" && value.trim()) return value;
	if (value && typeof value === "object") {
		return readDamlNumeric(value as Record<string, unknown>);
	}
	return "0";
};

const readTimestampLike = (value: unknown): string => {
	if (typeof value === "string") return value;
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	if (value && typeof value === "object") {
		return readDamlTimestamp(value as Record<string, unknown>);
	}
	return "";
};

const readDamlRecordFields = (value: Record<string, unknown> | undefined): DamlField[] => {
	if (!value) return [];
	return readDamlFields(readObj(value.record ?? value));
};

/** TransferOffer / TransferInstruction payload from a flat JSON object. */
const readTransferFromFlatObject = (
	transfer: Record<string, unknown>,
	providerFallback = ""
): TransferInstructionPayload | undefined => {
	const sender = readPartyLike(transfer.sender);
	const receiver = readPartyLike(transfer.receiver);
	if (!sender && !receiver) return undefined;

	return {
		sender,
		receiver,
		amount: readAmountLike(transfer.amount),
		executeBefore: readTimestampLike(transfer.executeBefore),
		provider: readPartyLike(transfer.provider) || providerFallback,
	};
};

const readTransferFromDamlFields = (
	fields: DamlField[],
	providerFallback = ""
): TransferInstructionPayload | undefined => {
	const transferValue = readDamlFieldValue(fields, "transfer");
	if (!transferValue) return undefined;

	// Nested Daml encoding: { record: { fields: [...] } } or { fields: [...] }
	const transferFields = readDamlRecordFields(transferValue);
	if (transferFields.length) {
		return {
			sender: readDamlParty(readDamlFieldValue(transferFields, "sender")),
			receiver: readDamlParty(readDamlFieldValue(transferFields, "receiver")),
			amount: readDamlNumeric(readDamlFieldValue(transferFields, "amount")),
			executeBefore: readDamlTimestamp(readDamlFieldValue(transferFields, "executeBefore")),
			provider:
				readDamlParty(readDamlFieldValue(transferFields, "provider")) || providerFallback,
		};
	}

	// Gateway sometimes unwraps nested records to a flat object inside `value`.
	return readTransferFromFlatObject(transferValue, providerFallback);
};

export const extractTransferInstructionFromCreateArgument = (
	createArgument: Record<string, unknown>
): TransferInstructionPayload | undefined => {
	const rootProvider =
		readPartyLike(createArgument.provider) ||
		readDamlParty(readDamlFieldValue(readDamlFields(createArgument), "provider"));

	const instruction = readObj(createArgument.instruction);
	if (instruction.receiver || instruction.sender) {
		return {
			sender: String(instruction.sender || createArgument.sender || ""),
			receiver: String(instruction.receiver || createArgument.receiver || ""),
			amount: String(instruction.amount || createArgument.amount || "0"),
			executeBefore: String(instruction.executeBefore || createArgument.executeBefore || ""),
			provider: String(instruction.provider || createArgument.provider || rootProvider || ""),
		};
	}

	const directTransfer = readTransferFromFlatObject(
		readObj(createArgument.transfer),
		rootProvider
	);
	if (directTransfer) {
		return directTransfer;
	}

	const rootFields = readDamlFields(createArgument);
	const transferFromRoot = readTransferFromDamlFields(rootFields, rootProvider);
	if (transferFromRoot?.receiver || transferFromRoot?.sender) {
		return transferFromRoot;
	}

	const instructionValue = readDamlFieldValue(rootFields, "instruction");
	const instructionFields = readDamlRecordFields(instructionValue);
	const transferFromInstruction = readTransferFromDamlFields(instructionFields, rootProvider);
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
			provider: rootProvider,
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

	// Daml JSON API timestamps are usually microseconds since epoch.
	const asNumber = Number(executeBefore);
	if (Number.isFinite(asNumber) && asNumber > 0) {
		const millis = asNumber > 1e14 ? asNumber / 1000 : asNumber;
		return millis <= now;
	}

	// Some gateways return ISO-8601 strings.
	const asDate = Date.parse(executeBefore);
	if (Number.isFinite(asDate)) {
		return asDate <= now;
	}

	return false;
};

/** Map raw active-contract entries to non-expired transfer offers for a party */
export type TransferOfferRole = "receiver" | "sender" | "any";

export const findTransferOffersInContracts = (
	contracts: Record<string, unknown>[],
	partyId: string,
	options: { role?: TransferOfferRole } = {}
): CantonTransferOffer[] => {
	const role = options.role ?? "receiver";
	const offers: CantonTransferOffer[] = [];

	for (const contract of contracts) {
		const createdEvent = extractActiveContractCreatedEvent(contract);
		const createArgument = readObj(createdEvent.createArgument);
		const transfer = extractTransferInstructionFromCreateArgument(createArgument);
		if (!transfer || isTransferOfferExpired(transfer.executeBefore)) {
			continue;
		}

		const matchesRole =
			role === "any"
				? transfer.receiver === partyId || transfer.sender === partyId
				: role === "sender"
					? transfer.sender === partyId
					: transfer.receiver === partyId;

		if (!matchesRole) {
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
			provider: transfer.provider,
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
		const fields = readDamlFields(createArgument);
		const owner =
			readPartyLike(createArgument.owner) ||
			readDamlParty(readDamlFieldValue(fields, "owner"));
		if (owner && owner !== partyId) continue;

		const templateId = String(createdEvent.templateId || "");
		if (!templateId) continue;

		const amount =
			fields.length > 0
				? readDamlNumeric(readDamlFieldValue(fields, "amount"))
				: readAmountLike(createArgument.amount);

		holdings.push({
			contractId,
			amount,
			createdEventBlob: String(createdEvent.createdEventBlob || ""),
			templateId,
		});
	}

	return holdings;
};
