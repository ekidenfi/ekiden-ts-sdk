import { afterEach, expect, type Mock, spyOn, test } from "bun:test";
import type { EkidenClientConfig } from "../src/core/config";
import type { ReferralCodeInfo } from "../src/modules/user/types";
import { UserClient } from "../src/modules/user/UserClient";

const config: EkidenClientConfig = {
	baseURL: "http://localhost",
	apiPrefix: "/api/v1",
	contractAddress: "0x1",
};

const CODE_INFO: ReferralCodeInfo = {
	code_id: "code-1",
	code: "SUMMER",
	label: "Summer campaign",
	is_default: false,
	created_at: 1_700_000_000,
	clicks: 12,
	binds: 3,
	downline_count: 7,
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

afterEach(() => {
	fetchSpy?.mockRestore();
});

test("createReferralCode POSTs to /user/referral-codes with auth + JSON body and returns the code", async () => {
	mockOnce(JSON.stringify(CODE_INFO));
	const client = new UserClient(config);
	client.setToken("test-token");

	const result = await client.createReferralCode({ code: "SUMMER", label: "Summer campaign" });

	const { url, init, headers } = lastCall();
	expect(fetchSpy).toHaveBeenCalledTimes(1);
	expect(url).toBe("http://localhost/api/v1/user/referral-codes");
	expect(init?.method).toBe("POST");
	expect(headers.Authorization).toBe("Bearer test-token");
	expect(JSON.parse(init?.body as string)).toEqual({ code: "SUMMER", label: "Summer campaign" });
	expect(result).toEqual(CODE_INFO);
});

test("listReferralCodes GETs /user/referral-codes with auth and returns the list", async () => {
	mockOnce(JSON.stringify({ codes: [CODE_INFO] }));
	const client = new UserClient(config);
	client.setToken("test-token");

	const result = await client.listReferralCodes();

	const { url, init, headers } = lastCall();
	expect(url).toBe("http://localhost/api/v1/user/referral-codes");
	expect(init?.method ?? "GET").toBe("GET");
	expect(headers.Authorization).toBe("Bearer test-token");
	expect(result).toEqual({ codes: [CODE_INFO] });
});

test("deleteReferralCode DELETEs the encoded id with auth and tolerates an empty body", async () => {
	mockOnce("", 200);
	const client = new UserClient(config);
	client.setToken("test-token");

	const result = await client.deleteReferralCode("code/1");

	const { url, init, headers } = lastCall();
	expect(url).toBe("http://localhost/api/v1/user/referral-codes/code%2F1");
	expect(init?.method).toBe("DELETE");
	expect(headers.Authorization).toBe("Bearer test-token");
	expect(result).toBeUndefined();
});

test("trackReferralClick POSTs /referral/click on an UNauthenticated client (public, no auth header)", async () => {
	mockOnce("", 200);
	const client = new UserClient(config); // no token set

	const result = await client.trackReferralClick({ code: "SUMMER" });

	const { url, init, headers } = lastCall();
	expect(url).toBe("http://localhost/api/v1/referral/click");
	expect(init?.method).toBe("POST");
	expect(headers.Authorization).toBeUndefined();
	expect(JSON.parse(init?.body as string)).toEqual({ code: "SUMMER" });
	expect(result).toBeUndefined();
});
