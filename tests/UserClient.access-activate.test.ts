import { afterEach, expect, type Mock, spyOn, test } from "bun:test";
import type { EkidenClientConfig } from "../src/core/config";
import type { AccessActivateResponse } from "../src/modules/user/types";
import { UserClient } from "../src/modules/user/UserClient";

const config: EkidenClientConfig = {
	baseURL: "http://localhost",
	apiPrefix: "/api/v1",
	contractAddress: "0x1",
};

const ACTIVATED: AccessActivateResponse = {
	activated: true,
	multiplier_bps: 5000,
	badge: true,
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

test("activateAccess POSTs the code to the authenticated /user/access/activate", async () => {
	// The wallet is identified by the session, so the body carries nothing else.
	// The pre-auth endpoint this replaces could not be used by custodial (Auth0)
	// wallets at all — they hold no signing key to sign its challenge with.
	mockOnce(JSON.stringify(ACTIVATED));
	const client = new UserClient(config);
	client.setToken("test-token");

	const result = await client.activateAccess({ code: "GOLD-TICKET" });

	const { url, init, headers } = lastCall();
	expect(fetchSpy).toHaveBeenCalledTimes(1);
	expect(url).toBe("http://localhost/api/v1/user/access/activate");
	expect(init?.method).toBe("POST");
	expect(headers.Authorization).toBe("Bearer test-token");
	expect(JSON.parse(init?.body as string)).toEqual({ code: "GOLD-TICKET" });
	expect(result).toEqual(ACTIVATED);
});

test("activateAccess sends no signature material", async () => {
	// Guards the regression that would reintroduce the ceremony: any of these
	// keys reaching the server means the caller is back on the old contract.
	mockOnce(JSON.stringify(ACTIVATED));
	const client = new UserClient(config);
	client.setToken("test-token");

	await client.activateAccess({ code: "GOLD-TICKET" });

	const body = JSON.parse(lastCall().init?.body as string) as Record<string, unknown>;
	for (const key of ["public_key", "signature", "signed_at", "party_id", "nonce", "id_token"]) {
		expect(body[key]).toBeUndefined();
	}
});
