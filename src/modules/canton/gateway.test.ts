import { describe, expect, it } from "bun:test";

import { CantonGatewayClient } from "./gateway";

type Captured = { url: string; headers: Record<string, string> };

const makeClient = (
	token: string | null | undefined,
	captured: Captured[],
	body: unknown = { amount: "1" }
) => {
	const fetchFn = (async (input: unknown, init: { headers?: Record<string, string> } = {}) => {
		captured.push({ url: String(input), headers: init.headers ?? {} });
		return new Response(JSON.stringify(body), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}) as unknown as typeof fetch;

	return new CantonGatewayClient({
		baseUrl: "https://gw.example/",
		getAccessToken: () => token,
		fetchFn,
	});
};

describe("CantonGatewayClient", () => {
	// The reason this client exists: the account/balance/holdings endpoints are no longer
	// unauthenticated, so every request must carry the caller's bearer token.
	it("attaches the bearer token when the caller is authenticated", async () => {
		const captured: Captured[] = [];
		await makeClient("tok-abc", captured).getBalance("partyA::x");

		expect(captured[0].headers.Authorization).toBe("Bearer tok-abc");
		expect(captured[0].url).toContain("/balance");
		expect(captured[0].url).toContain("partyId=partyA");
	});

	it("omits the Authorization header when there is no token", async () => {
		const captured: Captured[] = [];
		await makeClient(null, captured).getHoldings("partyA::x");

		expect(captured[0].headers.Authorization).toBeUndefined();
	});

	it("drops empty query params", async () => {
		const captured: Captured[] = [];
		await makeClient("t", captured).getContracts({
			partyId: "pA",
			templateId: "",
			signatories: undefined,
		});

		expect(captured[0].url).toContain("partyId=pA");
		expect(captured[0].url).not.toContain("templateId");
		expect(captured[0].url).not.toContain("signatories");
	});

	it("throws on a non-ok response", async () => {
		const fetchFn = (async () =>
			new Response("nope", { status: 401 })) as unknown as typeof fetch;
		const client = new CantonGatewayClient({
			baseUrl: "https://gw.example",
			getAccessToken: () => "t",
			fetchFn,
		});

		await expect(client.getAccount("p")).rejects.toThrow(/401/);
	});
});
