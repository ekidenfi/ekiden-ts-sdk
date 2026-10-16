import { BN } from "@/utils/BigNumber";
import { readCreateArgument } from "./ecosystemRewards";
import type { CantonGatewayClient, CantonGatewayContract } from "./gateway";
import type {
	CantonConfig,
	CantonDisclosedContract,
	FundingTransferFeeConfig,
	HoldingInstrumentId,
} from "./types";

const gatewayTemplateId = (packageName: string, module: string, entity: string): string =>
	`${packageName}:${module}:${entity}`;

const unwrapDamlValue = (value: unknown): unknown => {
	if (!value || typeof value !== "object") return value;
	const obj = value as Record<string, unknown>;
	if ("party" in obj) return obj.party;
	if ("contractId" in obj) return obj.contractId;
	if ("text" in obj) return obj.text;
	if ("numeric" in obj) return obj.numeric;
	if ("int64" in obj) return obj.int64;
	if ("bool" in obj) return obj.bool;
	if ("record" in obj) return unwrapDamlValue(obj.record);
	return value;
};

const readString = (value: unknown): string => String(unwrapDamlValue(value) ?? "");

const readInt = (value: unknown): number => {
	const unwrapped = unwrapDamlValue(value);
	if (typeof unwrapped === "number" && Number.isFinite(unwrapped)) return Math.trunc(unwrapped);
	if (typeof unwrapped === "string" && unwrapped.trim()) {
		const parsed = Number(unwrapped);
		return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
	}
	return 0;
};

/**
 * Reads the trailing `instrumentId : Optional InstrumentId`. Absent (pre-upgrade contracts) and
 * `None` both mean the quote. Accepts the flat encoding, `{ fields }` records and wrapped optionals.
 */
const readInstrumentId = (value: unknown): HoldingInstrumentId | null => {
	if (!value || typeof value !== "object") return null;
	const obj = value as Record<string, unknown>;
	if ("optional" in obj) {
		const optional = obj.optional as Record<string, unknown> | null;
		return readInstrumentId(optional?.value);
	}
	if ("Some" in obj) return readInstrumentId(obj.Some);
	if ("record" in obj) return readInstrumentId(obj.record);

	const fields = readCreateArgument(obj);
	const admin = readString(fields.admin);
	const id = readString(fields.id);
	return admin && id ? { admin, id } : null;
};

const sameInstrument = (a: HoldingInstrumentId | null, b: HoldingInstrumentId | null): boolean =>
	a === null || b === null ? a === b : a.admin === b.admin && a.id === b.id;

/** Matches on-ledger `FundingFee.fundingFeeCentsToDecimal` (cents → Decimal). */
export const fundingFeeCentsToDecimal = (cents: number): string => new BN(cents).div(100).toFixed();

/** Sum two Decimal-like amounts for CIP-56 transfer sizing (`amount + fee`). */
export const addFundingAmounts = (amount: string, fee: string): string =>
	new BN(amount || "0").plus(fee || "0").toFixed();

const parseFeeConfig = (
	contract: CantonGatewayContract,
	synchronizerId: string
): FundingTransferFeeConfig | null => {
	const createdEvent = contract.createdEvent;
	const contractId = createdEvent.contractId;
	const createdEventBlob = createdEvent.createdEventBlob;
	const templateId = createdEvent.templateId;
	if (!contractId || !createdEventBlob || !templateId) return null;

	const fields = readCreateArgument(createdEvent.createArgument);
	const depositFeeCents = readInt(fields.depositFeeCents);
	const withdrawFeeCents = readInt(fields.withdrawFeeCents);
	const feeReceiver = readString(fields.feeReceiver);
	const platform = readString(fields.platform);
	const bank = readString(fields.bank);

	const depositFee = fundingFeeCentsToDecimal(depositFeeCents);
	const withdrawFee = fundingFeeCentsToDecimal(withdrawFeeCents);

	return {
		contractId,
		templateId,
		createdEventBlob,
		synchronizerId: contract.synchronizerId || synchronizerId,
		platform,
		bank,
		feeReceiver,
		depositFeeCents,
		withdrawFeeCents,
		depositFee,
		withdrawFee,
		instrumentId: readInstrumentId(fields.instrumentId),
	};
};

export interface ResolveFundingFeeConfigResult {
	config: FundingTransferFeeConfig;
	/** Disclosure required so the submitting user can `fetch` the fee config. */
	disclosedContracts: CantonDisclosedContract[];
}

/**
 * Resolve the live `FundingTransferFeeConfig` of one asset from Canton Gateway ACS.
 * Required for deposit/withdraw choices — on-ledger `None` aborts.
 *
 * Each collateral asset has its own config, and the ledger aborts a deposit or withdrawal whose
 * config is for another asset ("funding fee config instrument mismatch"), so the config is selected
 * by `instrumentId`: `null` (the default) is the quote.
 */
export const resolveFundingFeeConfig = async ({
	config,
	gateway,
	instrumentId = null,
}: {
	config: CantonConfig;
	gateway?: CantonGatewayClient;
	instrumentId?: HoldingInstrumentId | null;
}): Promise<ResolveFundingFeeConfigResult> => {
	if (!gateway || !config.gatewayBaseUrl || !config.packageName) {
		throw new Error("Funding fee config requires canton.gatewayBaseUrl and canton.packageName");
	}

	const response = await gateway.getContracts({
		templateId: gatewayTemplateId(config.packageName, "FundingFee", "FundingTransferFeeConfig"),
	});

	const candidates = response.contracts
		.map((contract) => parseFeeConfig(contract, config.synchronizerId))
		.filter((entry): entry is FundingTransferFeeConfig => entry != null)
		.filter((entry) => sameInstrument(entry.instrumentId, instrumentId));

	if (!candidates.length) {
		const asset = instrumentId
			? `${instrumentId.admin}::${instrumentId.id}`
			: "the quote asset";
		throw new Error(`No active FundingTransferFeeConfig for ${asset} found on Canton Gateway`);
	}

	// Prefer a config matching this deployment's platform when identifiable.
	const matched =
		candidates.find((entry) => entry.platform === config.adminPartyId) ??
		candidates[candidates.length - 1];
	if (!matched) {
		throw new Error("No active FundingTransferFeeConfig found on Canton Gateway");
	}

	return {
		config: matched,
		disclosedContracts: [
			{
				templateId: matched.templateId,
				contractId: matched.contractId,
				createdEventBlob: matched.createdEventBlob,
				synchronizerId: matched.synchronizerId,
			},
		],
	};
};
