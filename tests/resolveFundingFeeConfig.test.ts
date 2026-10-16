import { expect, test } from "bun:test";
import { resolveFundingFeeConfig } from "../src/modules/canton/fundingFee";
import type { CantonGatewayClient } from "../src/modules/canton/gateway";
import type { CantonConfig } from "../src/modules/canton/types";

const PLATFORM = "ekiden-platform::1220aa";
const EXAU = { admin: "ember-gold::1220ad", id: "eXAU" };

const config = {
	adminPartyId: PLATFORM,
	gatewayBaseUrl: "https://gateway.test",
	packageName: "#ekiden-daml-contracts-v20",
	synchronizerId: "global-domain::1220",
} as CantonConfig;

const feeConfig = (contractId: string, args: Record<string, unknown>) => ({
	synchronizerId: "global-domain::1220",
	createdEvent: {
		contractId,
		templateId: "pkg:FundingFee:FundingTransferFeeConfig",
		createdEventBlob: `blob-${contractId}`,
		createArgument: {
			platform: PLATFORM,
			bank: "bank::1220",
			feeReceiver: "fees::1220",
			depositFeeCents: 100,
			withdrawFeeCents: 50,
			...args,
		},
	},
});

// The asset's config is listed first: the previous resolver returned it for quote deposits.
const gateway = {
	getContracts: async () => ({
		contracts: [
			feeConfig("00gold", { instrumentId: EXAU, depositFeeCents: 2500 }),
			feeConfig("00quote", { instrumentId: null }),
		],
	}),
} as unknown as CantonGatewayClient;

test("resolveFundingFeeConfig selects the quote's config by default", async () => {
	const { config: resolved, disclosedContracts } = await resolveFundingFeeConfig({
		config,
		gateway,
	});

	expect(resolved.contractId).toBe("00quote");
	expect(resolved.instrumentId).toBeNull();
	expect(disclosedContracts.map((contract) => contract.contractId)).toEqual(["00quote"]);
});

test("resolveFundingFeeConfig selects an asset's own config", async () => {
	const { config: resolved } = await resolveFundingFeeConfig({
		config,
		gateway,
		instrumentId: EXAU,
	});

	expect(resolved.contractId).toBe("00gold");
	expect(resolved.depositFee).toBe("25");
	expect(resolved.instrumentId).toEqual(EXAU);
});

test("resolveFundingFeeConfig reads a pre-upgrade config without instrumentId as the quote", async () => {
	const legacy = {
		getContracts: async () => ({ contracts: [feeConfig("00legacy", {})] }),
	} as unknown as CantonGatewayClient;

	const { config: resolved } = await resolveFundingFeeConfig({ config, gateway: legacy });

	expect(resolved.contractId).toBe("00legacy");
});

test("resolveFundingFeeConfig fails when the asset has no config", async () => {
	expect(
		resolveFundingFeeConfig({
			config,
			gateway,
			instrumentId: { admin: "usd1::1220", id: "USD1" },
		})
	).rejects.toThrow("No active FundingTransferFeeConfig for usd1::1220::USD1");
});
