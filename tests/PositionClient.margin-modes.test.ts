import { afterEach, expect, type Mock, spyOn, test } from "bun:test";
import type { EkidenClientConfig } from "../src/core/config";
import { APIError, AuthenticationError } from "../src/core/errors/EkidenError";
import { PositionClient } from "../src/modules/position/PositionClient";
import type {
	AdjustIsolatedMarginResponse,
	GetMarginModesResponse,
	IsolatedMargin,
} from "../src/modules/position/types";

const config: EkidenClientConfig = {
	baseURL: "http://localhost",
	apiPrefix: "/api/v1",
	contractAddress: "0x1",
};

const BUCKET: IsolatedMargin = {
	value: "412.5",
	liquidation_value: "120",
	legs: [
		{ asset_id: "1", symbol: "USDC", amount: "-80", quote_equiv: "-80" },
		{ asset_id: "3", symbol: "XAUT", amount: "0.2", quote_equiv: "492.5" },
	],
};

let fetchSpy: Mock<typeof fetch>;

const mockOnce = (body: string, status = 200) => {
	fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response(body, { status }));
};

const lastCall = () => {
	const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit | undefined];
	const headers = (init?.headers ?? {}) as Record<string, string>;
	return { url, init, headers };
};

const authedClient = () => {
	const client = new PositionClient(config);
	client.setToken("test-token");
	return client;
};

afterEach(() => {
	fetchSpy?.mockRestore();
});

test("setMarginMode POSTs the request to /position/set-margin-mode with auth", async () => {
	mockOnce(JSON.stringify({ success: true, time: "1760000000000" }));

	const result = await authedClient().setMarginMode({
		sub_account_address: "0xsub",
		symbol: "BTC-USDC",
		margin_mode: "Isolated",
	});

	const { url, init, headers } = lastCall();
	expect(url).toBe("http://localhost/api/v1/position/set-margin-mode");
	expect(init?.method).toBe("POST");
	expect(headers.Authorization).toBe("Bearer test-token");
	expect(JSON.parse(init?.body as string)).toEqual({
		sub_account_address: "0xsub",
		symbol: "BTC-USDC",
		margin_mode: "Isolated",
	});
	expect(result).toEqual({ success: true, time: "1760000000000" });
});

test("adjustIsolatedMargin POSTs to /position/adjust-isolated-margin and returns the new bucket", async () => {
	const response: AdjustIsolatedMarginResponse = {
		success: true,
		time: "1760000000000",
		isolated_margin: BUCKET,
	};
	mockOnce(JSON.stringify(response));

	const result = await authedClient().adjustIsolatedMargin({
		sub_account_address: "0xsub",
		symbol: "BTC-USDC",
		asset_id: "3",
		amount: "0.2",
		direction: "Add",
	});

	const { url, init, headers } = lastCall();
	expect(url).toBe("http://localhost/api/v1/position/adjust-isolated-margin");
	expect(init?.method).toBe("POST");
	expect(headers.Authorization).toBe("Bearer test-token");
	expect(JSON.parse(init?.body as string)).toEqual({
		sub_account_address: "0xsub",
		symbol: "BTC-USDC",
		asset_id: "3",
		amount: "0.2",
		direction: "Add",
	});
	expect(result.isolated_margin).toEqual(BUCKET);
});

test("getMarginModes GETs /position/margin-modes with the subaccount as query and auth", async () => {
	const response: GetMarginModesResponse = {
		list: [{ symbol: "BTC-USDC", margin_mode: "Isolated", isolated_margin: BUCKET }],
	};
	mockOnce(JSON.stringify(response));

	const result = await authedClient().getMarginModes({ sub_account_address: "0xsub" });

	const { url, init, headers } = lastCall();
	expect(url).toBe("http://localhost/api/v1/position/margin-modes?sub_account_address=0xsub");
	expect(init?.method ?? "GET").toBe("GET");
	expect(headers.Authorization).toBe("Bearer test-token");
	expect(result).toEqual(response);
});

test("margin-mode methods refuse to send without a token", async () => {
	fetchSpy = spyOn(globalThis, "fetch");
	const client = new PositionClient(config);

	await expect(
		client.setMarginMode({
			sub_account_address: "0xsub",
			symbol: "BTC-USDC",
			margin_mode: "Cross",
		})
	).rejects.toBeInstanceOf(AuthenticationError);
	await expect(client.getMarginModes({ sub_account_address: "0xsub" })).rejects.toBeInstanceOf(
		AuthenticationError
	);
	expect(fetchSpy).not.toHaveBeenCalled();
});

test("a 400 Ec… reject surfaces its code on APIError", async () => {
	mockOnce(
		JSON.stringify({
			code: "EcMarginModeChangeWithExposure",
			message: "close the position and cancel open orders first",
		}),
		400
	);

	const error = await authedClient()
		.setMarginMode({ sub_account_address: "0xsub", symbol: "BTC-USDC", margin_mode: "Cross" })
		.catch((e: unknown) => e);

	expect(error).toBeInstanceOf(APIError);
	expect((error as APIError).code).toBe("EcMarginModeChangeWithExposure");
	expect((error as APIError).statusCode).toBe(400);
});
