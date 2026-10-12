import { afterEach, expect, type Mock, spyOn, test } from "bun:test";
import type { EkidenClientConfig } from "../src/core/config";
import { AssetClient } from "../src/modules/asset/AssetClient";
import type { GetCollateralAssetsResponse } from "../src/types/api";

const config: EkidenClientConfig = {
	baseURL: "http://localhost",
	apiPrefix: "/api/v1",
	contractAddress: "0x1",
};

let fetchSpy: Mock<typeof fetch>;

afterEach(() => {
	fetchSpy?.mockRestore();
});

test("getCollateralAssets GETs /collateral/assets without auth and returns the registry", async () => {
	const response: GetCollateralAssetsResponse = {
		list: [
			{
				asset_id: 3,
				instrument_id: "admin::XAUT",
				symbol: "XAUT",
				decimals: 6,
				kind: "volatile",
				status: "active",
				initial_weight: "0.8",
				maintenance_weight: "0.85",
				max_total_deposit: "1000",
				max_user_deposit: null,
				liquidation_discount: "0.95",
				closed_market_haircut: "0.03",
				market_session: "open",
				liquidation_priority: 2,
				total_deposited: "250",
				cap_utilization: "0.25",
				allowed_in_isolated: true,
			},
		],
		isolated_margin_enabled: false,
	};
	fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(JSON.stringify(response), { status: 200 })
	);

	const result = await new AssetClient(config).getCollateralAssets();

	const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
	const headers = (init?.headers ?? {}) as Record<string, string>;
	expect(url).toBe("http://localhost/api/v1/collateral/assets");
	expect(init?.method ?? "GET").toBe("GET");
	expect(headers.Authorization).toBeUndefined();
	expect(result).toEqual(response);
});
