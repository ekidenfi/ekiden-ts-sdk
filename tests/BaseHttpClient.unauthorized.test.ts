import { afterEach, beforeEach, expect, type Mock, spyOn, test } from "bun:test";
import { BaseHttpClient, setUnauthorizedCallback } from "../src/core/base";
import type { EkidenClientConfig } from "../src/core/config";
import { APIError } from "../src/core/errors";

// Expose the protected `request` for testing.
class TestClient extends BaseHttpClient {
	call<T>(path: string, options: RequestInit = {}, config: { auth?: boolean } = {}): Promise<T> {
		return this.request<T>(path, options, config);
	}
}

const config: EkidenClientConfig = {
	baseURL: "http://localhost",
	apiPrefix: "/api/v1",
	contractAddress: "0x1",
};

let fetchSpy: Mock<typeof fetch>;

beforeEach(() => {
	// The one request each test makes gets a 401 with a JSON error body.
	fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(JSON.stringify({ error: "bad signature" }), { status: 401 })
	);
});

afterEach(() => {
	fetchSpy.mockRestore();
	setUnauthorizedCallback(null);
});

test("auth:true 401 fires the unauthorized callback and throws APIError", async () => {
	let fired = 0;
	setUnauthorizedCallback(() => {
		fired += 1;
	});

	const client = new TestClient(config);
	const err = await client.call("/user/root-account", {}, { auth: true }).catch((e) => e);

	expect(err).toBeInstanceOf(APIError);
	expect((err as APIError).statusCode).toBe(401);
	expect(fired).toBe(1);
});

test("auth:false 401 does NOT fire the callback but still throws APIError", async () => {
	let fired = 0;
	setUnauthorizedCallback(() => {
		fired += 1;
	});

	const client = new TestClient(config);
	const err = await client
		.call("/access/activate", { method: "POST" }, { auth: false })
		.catch((e) => e);

	expect(err).toBeInstanceOf(APIError);
	expect((err as APIError).statusCode).toBe(401);
	expect(fired).toBe(0);
});
