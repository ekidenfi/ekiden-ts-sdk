import type { CantonGatewayClient, CantonGatewayContract } from "./gateway";
import type { CantonRegistryClient } from "./registry";
import type {
	CantonConfig,
	CantonDisclosedContract,
	CantonHolding,
	EcosystemFundKind,
	EcosystemRewardAction,
	EcosystemRewardsHook,
	HoldingInstrumentId,
	RewardDistributionInput,
} from "./types";

const FUND_KINDS: EcosystemFundKind[] = [
	"DevFund",
	"GrowthFund",
	"UserRewardFund",
	"MarketMakingFund",
];

const DEFAULT_HOLDING_TEMPLATE_ID =
	"#utility-registry-holding-v0:Utility.Registry.Holding.V0.Holding:Holding";

const readObj = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== "object") return {};
	return value as Record<string, unknown>;
};

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** Normalize Daml createArgument — flat object or `{ fields: [{ label, value }] }`. */
export const readCreateArgument = (createArgument: unknown): Record<string, unknown> => {
	const arg = readObj(createArgument);
	if (!Array.isArray(arg.fields)) return arg;

	return Object.fromEntries(
		(arg.fields as Array<{ label?: unknown; value?: unknown }>)
			.filter((field) => typeof field.label === "string" && field.label.length > 0)
			.map((field) => [field.label as string, field.value])
	);
};

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
	if ("variant" in obj) return obj.variant;
	if ("list" in obj) return obj.list;
	if ("optional" in obj) return obj.optional;
	if ("enum" in obj) return obj.enum;
	return value;
};

const readBool = (value: unknown): boolean => {
	const unwrapped = unwrapDamlValue(value);
	if (typeof unwrapped === "boolean") return unwrapped;
	if (typeof unwrapped === "string") return unwrapped.toLowerCase() === "true";
	return Boolean(unwrapped);
};

const readNumber = (value: unknown): number => {
	const unwrapped = unwrapDamlValue(value);
	if (typeof unwrapped === "number") return Number.isFinite(unwrapped) ? unwrapped : 0;
	if (typeof unwrapped === "string") {
		const parsed = Number(unwrapped);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
};

const readString = (value: unknown): string => String(unwrapDamlValue(value) ?? "");

const readList = (value: unknown): unknown[] => {
	const unwrapped = unwrapDamlValue(value);
	if (Array.isArray(unwrapped)) return unwrapped;
	const obj = readObj(unwrapped);
	if (Array.isArray(obj.elements)) return obj.elements;
	return toArray(unwrapped);
};

const readVariantTag = (value: unknown): string => {
	const unwrapped = unwrapDamlValue(value);
	const obj = readObj(unwrapped);
	if (typeof obj.tag === "string") return obj.tag;
	if (typeof obj.constructor === "string") return obj.constructor;
	if (typeof unwrapped === "string") return unwrapped;
	return "";
};

const asFundKind = (tag: string): EcosystemFundKind | null =>
	FUND_KINDS.includes(tag as EcosystemFundKind) ? (tag as EcosystemFundKind) : null;

const readInstrumentId = (value: unknown): HoldingInstrumentId | null => {
	const fields = readCreateArgument(unwrapDamlValue(value));
	// Config assets use `admin`; utility Holding uses `source`.
	const admin = readString(fields.admin) || readString(fields.source);
	const id = readString(fields.id);
	if (!admin || !id) return null;
	return { admin, id };
};

const instrumentEq = (a: HoldingInstrumentId, b: HoldingInstrumentId): boolean =>
	a.admin === b.admin && a.id === b.id;

const holdingsFromGatewayContracts = (
	contracts: CantonGatewayContract[],
	ownerPartyId: string,
	instrumentId: HoldingInstrumentId
): CantonHolding[] => {
	const holdings: CantonHolding[] = [];
	for (const contract of contracts) {
		const createdEvent = contract.createdEvent;
		const contractId = createdEvent.contractId;
		const createdEventBlob = createdEvent.createdEventBlob;
		const templateId = createdEvent.templateId;
		if (!contractId || !createdEventBlob || !templateId) continue;

		const fields = readCreateArgument(createdEvent.createArgument);
		const owner = readString(fields.owner);
		if (owner && owner !== ownerPartyId) continue;

		const holdingInstrument = readInstrumentId(fields.instrument);
		if (!holdingInstrument || !instrumentEq(holdingInstrument, instrumentId)) continue;

		holdings.push({
			contractId,
			amount: readString(fields.amount) || "0",
			createdEventBlob,
			templateId,
		});
	}
	return holdings;
};

interface RewardAssetSpecParsed {
	instrumentId: HoldingInstrumentId;
	enabled: boolean;
	amount: number;
}

interface FundReceiveSpecParsed {
	fund: EcosystemFundKind;
	instruments: HoldingInstrumentId[];
}

interface ActionFundReceiveSpecParsed {
	action: string;
	enabled: boolean;
	fundReceives: FundReceiveSpecParsed[];
}

interface EcosystemRewardsConfigParsed {
	enabled: boolean;
	maxAssetsPerTx: number;
	assets: RewardAssetSpecParsed[];
	actionRules: ActionFundReceiveSpecParsed[];
}

interface EcosystemFundPartiesParsed {
	dev: string;
	growth: string;
	userReward: string;
	marketMaking: string;
}

interface EcosystemRewardsDistributionParsed {
	contractId: string;
	templateId: string;
	createdEventBlob: string;
	synchronizerId: string;
	distributor: string;
	configCid: string;
	/** CIP-56 send consent; Distribute fetches then exercises AuthorizeRewardTransfer. */
	spendAuthorityCid: string;
	funds: EcosystemFundPartiesParsed;
}

export interface ResolveEcosystemRewardsHookResult {
	hook: EcosystemRewardsHook | null;
	disclosedContracts: CantonDisclosedContract[];
}

const parseAssetSpec = (value: unknown): RewardAssetSpecParsed | null => {
	const fields = readCreateArgument(unwrapDamlValue(value));
	const instrumentId = readInstrumentId(fields.instrumentId);
	if (!instrumentId) return null;
	return {
		instrumentId,
		enabled: readBool(fields.enabled),
		amount: readNumber(fields.amount),
	};
};

const parseFundReceive = (value: unknown): FundReceiveSpecParsed | null => {
	const fields = readCreateArgument(unwrapDamlValue(value));
	const fund = asFundKind(readVariantTag(fields.fund));
	if (!fund) return null;
	const instruments = readList(fields.instruments)
		.map(readInstrumentId)
		.filter((id): id is HoldingInstrumentId => id != null);
	return { fund, instruments };
};

const parseActionRule = (value: unknown): ActionFundReceiveSpecParsed | null => {
	const fields = readCreateArgument(unwrapDamlValue(value));
	const action = readVariantTag(fields.action);
	if (!action) return null;
	const fundReceives = readList(fields.fundReceives)
		.map(parseFundReceive)
		.filter((spec): spec is FundReceiveSpecParsed => spec != null);
	return {
		action,
		enabled: readBool(fields.enabled),
		fundReceives,
	};
};

const parseConfig = (createArgument: unknown): EcosystemRewardsConfigParsed | null => {
	const fields = readCreateArgument(createArgument);
	if (!("assets" in fields) && !("enabled" in fields)) return null;
	const assets = readList(fields.assets)
		.map(parseAssetSpec)
		.filter((asset): asset is RewardAssetSpecParsed => asset != null);
	const actionRules = readList(fields.actionRules)
		.map(parseActionRule)
		.filter((rule): rule is ActionFundReceiveSpecParsed => rule != null);
	return {
		enabled: readBool(fields.enabled),
		maxAssetsPerTx: Math.max(0, Math.min(4, Math.trunc(readNumber(fields.maxAssetsPerTx)))),
		assets,
		actionRules,
	};
};

const parseFundParties = (value: unknown): EcosystemFundPartiesParsed | null => {
	const fields = readCreateArgument(unwrapDamlValue(value));
	const dev = readString(fields.dev);
	const growth = readString(fields.growth);
	const userReward = readString(fields.userReward);
	const marketMaking = readString(fields.marketMaking);
	if (!dev || !growth || !userReward || !marketMaking) return null;
	return { dev, growth, userReward, marketMaking };
};

const parseDistribution = (
	contract: CantonGatewayContract,
	synchronizerIdFallback: string
): EcosystemRewardsDistributionParsed | null => {
	const fields = readCreateArgument(contract.createdEvent.createArgument);
	const funds = parseFundParties(fields.funds);
	const distributor = readString(fields.distributor);
	const configCid = readString(fields.configCid);
	const spendAuthorityCid = readString(fields.spendAuthorityCid);
	const createdEventBlob = contract.createdEvent.createdEventBlob;
	if (!funds || !distributor || !configCid || !spendAuthorityCid || !createdEventBlob) {
		return null;
	}
	return {
		contractId: contract.createdEvent.contractId,
		templateId: contract.createdEvent.templateId,
		createdEventBlob,
		synchronizerId: contract.synchronizerId || synchronizerIdFallback,
		distributor,
		configCid,
		spendAuthorityCid,
		funds,
	};
};

const fundParty = (funds: EcosystemFundPartiesParsed, kind: EcosystemFundKind): string => {
	switch (kind) {
		case "DevFund":
			return funds.dev;
		case "GrowthFund":
			return funds.growth;
		case "UserRewardFund":
			return funds.userReward;
		case "MarketMakingFund":
			return funds.marketMaking;
	}
};

/** Odd recipient count (>1): drop the last (matches Daml `selectRecipients`). */
const selectRecipients = <T>(items: T[]): T[] => {
	const n = items.length;
	if (n > 1 && n % 2 === 1) return items.slice(0, n - 1);
	return items;
};

const gatewayTemplateId = (packageName: string, module: string, entity: string): string =>
	`${packageName}:${module}:${entity}`;

const selectCoveringHoldings = (holdings: CantonHolding[], need: number): CantonHolding[] => {
	if (need <= 0) return [];
	const ranked = [...holdings]
		.map((h) => ({ holding: h, amount: Number(h.amount) || 0 }))
		.filter((entry) => entry.amount > 0)
		.sort((a, b) => b.amount - a.amount);

	const selected: CantonHolding[] = [];
	let covered = 0;
	for (const entry of ranked) {
		selected.push(entry.holding);
		covered += entry.amount;
		if (covered >= need) break;
	}
	return covered >= need ? selected : [];
};

/**
 * Resolve optional ecosystem rewards hook for a User choice.
 * Returns `hook: null` when gateway/config is missing or rewards are disabled.
 * Missing per-payout inputs are omitted (on-ledger soft-skip).
 */
export const resolveEcosystemRewardsHook = async ({
	config,
	gateway,
	registry,
	action,
}: {
	config: CantonConfig;
	gateway?: CantonGatewayClient;
	registry: CantonRegistryClient;
	action: EcosystemRewardAction;
}): Promise<ResolveEcosystemRewardsHookResult> => {
	const empty: ResolveEcosystemRewardsHookResult = { hook: null, disclosedContracts: [] };

	if (!gateway || !config.gatewayBaseUrl || !config.packageName) {
		return empty;
	}
	try {
		const [configResponse, distributionResponse, spendAuthorityResponse] = await Promise.all([
			gateway.getContracts({
				templateId: gatewayTemplateId(
					config.packageName,
					"EcosystemRewards",
					"EcosystemRewardsConfig"
				),
			}),
			gateway.getContracts({
				templateId: gatewayTemplateId(
					config.packageName,
					"EcosystemRewards",
					"EcosystemRewardsDistribution"
				),
			}),
			gateway.getContracts({
				templateId: gatewayTemplateId(
					config.packageName,
					"EcosystemRewards",
					"EcosystemRewardSpendAuthority"
				),
			}),
		]);
		const distributionContract = distributionResponse.contracts.at(-1);
		if (!distributionContract) {
			return empty;
		}
		const distribution = parseDistribution(distributionContract, config.synchronizerId);
		if (!distribution) {
			return empty;
		}

		// Ledger `fetch`es configCid + spendAuthorityCid during Distribute; the submitting
		// user party does not see those on ACS, so they must be disclosed (same as tests'
		// rewardDisclosures). Prefer exact CIDs referenced by the active distribution.
		const configContract = configResponse.contracts.find(
			(contract) => contract.createdEvent.contractId === distribution.configCid
		);
		const spendAuthorityContract = spendAuthorityResponse.contracts.find(
			(contract) => contract.createdEvent.contractId === distribution.spendAuthorityCid
		);
		if (
			!configContract?.createdEvent.createdEventBlob ||
			!spendAuthorityContract?.createdEvent.createdEventBlob
		) {
			return empty;
		}
		const parsedConfig = parseConfig(configContract.createdEvent.createArgument);
		if (!parsedConfig || !parsedConfig.enabled) {
			return empty;
		}
		const distributorParty = distribution.distributor;

		const distributionDisclosure: CantonDisclosedContract = {
			templateId: distribution.templateId,
			contractId: distribution.contractId,
			createdEventBlob: distribution.createdEventBlob,
			synchronizerId: distribution.synchronizerId,
		};
		const configDisclosure: CantonDisclosedContract = {
			templateId: configContract.createdEvent.templateId,
			contractId: configContract.createdEvent.contractId,
			createdEventBlob: configContract.createdEvent.createdEventBlob,
			synchronizerId: configContract.synchronizerId || config.synchronizerId,
		};
		const spendAuthorityDisclosure: CantonDisclosedContract = {
			templateId: spendAuthorityContract.createdEvent.templateId,
			contractId: spendAuthorityContract.createdEvent.contractId,
			createdEventBlob: spendAuthorityContract.createdEvent.createdEventBlob,
			synchronizerId: spendAuthorityContract.synchronizerId || config.synchronizerId,
		};
		const baseDisclosures = [
			distributionDisclosure,
			configDisclosure,
			spendAuthorityDisclosure,
		];

		const actionRule = parsedConfig.actionRules.find((rule) => rule.action === action);
		const enabledAssets = actionRule?.enabled
			? parsedConfig.assets
					.filter((asset) => asset.enabled && asset.amount > 0)
					.slice(0, parsedConfig.maxAssetsPerTx || 0)
			: [];
		if (!actionRule?.enabled || !enabledAssets.length) {
			return {
				hook: { distributionCid: distribution.contractId, inputs: [] },
				disclosedContracts: baseDisclosures,
			};
		}

		const holdingsByAdmin = new Map<string, CantonGatewayContract[]>();
		const loadHoldingsForAdmin = async (
			instrumentAdmin: string
		): Promise<CantonGatewayContract[]> => {
			const cached = holdingsByAdmin.get(instrumentAdmin);
			if (cached) return cached;
			const response = await gateway.getContracts({
				partyId: distributorParty,
				templateId: DEFAULT_HOLDING_TEMPLATE_ID,
				signatories: instrumentAdmin,
			});
			holdingsByAdmin.set(instrumentAdmin, response.contracts);
			return response.contracts;
		};

		const disclosedContracts: CantonDisclosedContract[] = [...baseDisclosures];
		const inputs: RewardDistributionInput[] = [];
		const usedHoldingCids = new Set<string>();

		for (const asset of enabledAssets) {
			const optedFunds = actionRule.fundReceives
				.filter((spec) =>
					spec.instruments.some((instrument) =>
						instrumentEq(instrument, asset.instrumentId)
					)
				)
				.map((spec) => spec.fund);
			// Deduplicate fund kinds preserving order
			const uniqueFunds = optedFunds.filter(
				(fund, index) => optedFunds.indexOf(fund) === index
			);
			const recipients = selectRecipients(uniqueFunds);
			if (!recipients.length) continue;

			const share = asset.amount / recipients.length;
			if (share <= 0) continue;

			const holdingContracts = await loadHoldingsForAdmin(asset.instrumentId.admin);
			const instrumentHoldings = holdingsFromGatewayContracts(
				holdingContracts,
				distributorParty,
				asset.instrumentId
			);

			for (const fund of recipients) {
				const receiver = fundParty(distribution.funds, fund);
				const availableHoldings = instrumentHoldings.filter(
					(holding) => !usedHoldingCids.has(holding.contractId)
				);
				const covering = selectCoveringHoldings(availableHoldings, share);
				if (!covering.length) continue;

				const holdingCids = covering.map((h) => h.contractId);
				// Reserve immediately so the next fund cannot reuse the same UTXO.
				for (const holding of covering) {
					usedHoldingCids.add(holding.contractId);
				}

				try {
					const transferFactory = await registry.fetchTransferFactory({
						sender: distributorParty,
						receiver,
						amount: String(share),
						inputHoldingCids: holdingCids,
						instrumentAdmin: asset.instrumentId.admin,
						instrumentId: asset.instrumentId.id,
					});

					if (transferFactory.transferKind !== "direct") {
						for (const holding of covering) {
							usedHoldingCids.delete(holding.contractId);
						}
						continue;
					}

					for (const holding of covering) {
						if (holding.createdEventBlob) {
							disclosedContracts.push({
								templateId: holding.templateId,
								contractId: holding.contractId,
								createdEventBlob: holding.createdEventBlob,
								synchronizerId: config.synchronizerId,
							});
						}
					}
					disclosedContracts.push(...transferFactory.disclosedContracts);

					inputs.push({
						instrumentId: asset.instrumentId,
						fund,
						holdings: holdingCids,
						transferFactoryCid: transferFactory.factoryId,
						transferExtraArgs: transferFactory.transferExtraArgs,
						transferMeta: { values: {} },
					});
				} catch {
					// Soft-skip this payout input; parent User choice must still succeed.
					for (const holding of covering) {
						usedHoldingCids.delete(holding.contractId);
					}
				}
			}
		}

		return {
			hook: {
				distributionCid: distribution.contractId,
				inputs,
			},
			disclosedContracts,
		};
	} catch {
		// Gateway/registry failures must not block User flows.
		return empty;
	}
};
