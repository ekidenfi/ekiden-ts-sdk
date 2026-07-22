import { afterEach, describe, expect, it } from "bun:test";
import { setUnauthorizedCallback } from "@/core/base/BaseHttpClient";
import { APIError } from "@/core/errors/EkidenError";
import { UserClient } from "@/modules/user/UserClient";

/**
 * The gateway answers errors as `{ code, message }` — `code` being the stable machine-readable
 * discriminator (e.g. CANTON_PARTY_NOT_PROVISIONED, ROOT_ADDRESS_NOT_WHITELISTED). The SDK used
 * to read `errorData.error`, a different service's envelope, so `code` never reached callers and
 * the only way to branch on a condition was to match the English sentence.
 */

const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
});

function respondWith(status: number, body: unknown) {
	globalThis.fetch = (async () =>
		new Response(typeof body === "string" ? body : JSON.stringify(body), {
			status,
			headers: { "content-type": "application/json" },
		})) as unknown as typeof fetch;
}

function client() {
	return new UserClient({
		baseURL: "https://api.test.invalid",
		apiPrefix: "/api/v1",
		contractAddress: "0x1",
	});
}

describe("BaseHttpClient error envelope", () => {
	it("exposes the gateway's machine-readable code on APIError", async () => {
		respondWith(401, {
			code: "CANTON_PARTY_NOT_PROVISIONED",
			message: "Canton party is not provisioned for this account yet; retry shortly",
		});

		const err = (await client()
			.authorize({ signature: "", public_key: "", timestamp_ms: 0, nonce: "n" })
			.catch((e: unknown) => e)) as APIError;

		expect(err).toBeInstanceOf(APIError);
		expect(err.code).toBe("CANTON_PARTY_NOT_PROVISIONED");
		expect(err.statusCode).toBe(401);
	});

	it("still surfaces the human message", async () => {
		respondWith(401, {
			code: "CANTON_ID_TOKEN_STALE",
			message: "Canton id_token is stale; obtain a fresh token and retry",
		});

		const err = (await client()
			.authorize({ signature: "", public_key: "", timestamp_ms: 0, nonce: "n" })
			.catch((e: unknown) => e)) as APIError;

		expect(err.message).toContain("stale");
	});

	/** Other services use `{ error, message }`; that envelope must keep working. */
	it("keeps reading the legacy `error` envelope", async () => {
		respondWith(500, { error: "faucet_error", message: "Funding failed" });

		const err = (await client()
			.authorize({ signature: "", public_key: "", timestamp_ms: 0, nonce: "n" })
			.catch((e: unknown) => e)) as APIError;

		expect(err.code).toBe("faucet_error");
		expect(err.message).toContain("Funding failed");
	});

	it("does not drive the app's re-login flow from a pre-auth 401", async () => {
		// /authorize is a public call: its 401 means "these login credentials were refused",
		// not "your session expired". Retrying it (as the client must during the Canton party
		// provisioning race) would otherwise fire the re-login callback on every attempt.
		respondWith(401, { code: "CANTON_PARTY_NOT_PROVISIONED", message: "not yet" });

		let called = 0;
		setUnauthorizedCallback(() => {
			called += 1;
		});

		await client()
			.authorize({ signature: "", public_key: "", timestamp_ms: 0, nonce: "n" })
			.catch(() => undefined);

		expect(called).toBe(0);
		setUnauthorizedCallback(null);
	});

	it("still drives it from an authenticated 401", async () => {
		respondWith(401, { code: "UNAUTHORIZED", message: "session expired" });

		let called = 0;
		setUnauthorizedCallback(() => {
			called += 1;
		});

		const c = client();
		c.setToken("stale-token");
		await c.getRootAccount().catch(() => undefined);

		expect(called).toBe(1);
		setUnauthorizedCallback(null);
	});

	it("leaves code undefined when the body carries none", async () => {
		respondWith(502, "upstream exploded");

		const err = (await client()
			.authorize({ signature: "", public_key: "", timestamp_ms: 0, nonce: "n" })
			.catch((e: unknown) => e)) as APIError;

		expect(err.code).toBeUndefined();
		expect(err.statusCode).toBe(502);
	});
});
