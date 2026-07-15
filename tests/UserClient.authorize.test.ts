import { afterEach, beforeEach, expect, type Mock, spyOn, test } from "bun:test";
import type { EkidenClientConfig } from "../src/core/config";
import { type CantonWalletProvider, UserClient } from "../src/modules/user";
import { encodeBase64Ascii } from "../src/utils/account";

const config: EkidenClientConfig = {
	baseURL: "http://localhost",
	apiPrefix: "/api/v1",
	contractAddress: "0x1",
};

const TOKEN = "jwt-token";
const USER_ID = "user-123";

let fetchSpy: Mock<typeof fetch>;

beforeEach(() => {
	fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(JSON.stringify({ token: TOKEN, user_id: USER_ID }), { status: 200 })
	);
});

afterEach(() => {
	fetchSpy.mockRestore();
});

/** Parse the JSON body of the single fetch call the test made. */
const postedBody = (): Record<string, unknown> => {
	const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
	return JSON.parse(init.body as string);
};

test("authorizeWithCantonWallet base64-wraps the challenge and POSTs the party payload", async () => {
	let signedMessage: string | undefined;
	const provider: CantonWalletProvider = {
		getPrimaryAccount: async () => ({ partyId: "party::abc", publicKey: "deadbeef" }),
		signMessage: async ({ message }) => {
			signedMessage = message;
			return { signature: "sig-base64" };
		},
	};

	const client = new UserClient(config);
	const res = await client.authorizeWithCantonWallet(provider);

	// Exchanged the token and stored it.
	expect(res).toEqual({ token: TOKEN, user_id: USER_ID });
	expect(client.getToken()).toBe(TOKEN);

	// Hit POST /authorize.
	expect(fetchSpy).toHaveBeenCalledTimes(1);
	const url = fetchSpy.mock.calls[0]?.[0] as string;
	expect(url).toBe("http://localhost/api/v1/authorize");

	const body = postedBody();
	// The exact self-custody payload, nothing more.
	expect(body.party_id).toBe("party::abc");
	expect(body.public_key).toBe("deadbeef");
	expect(body.signature).toBe("sig-base64");
	expect(typeof body.timestamp_ms).toBe("number");
	expect(typeof body.nonce).toBe("string");
	expect(body.id_token).toBeUndefined();

	// The wallet was asked to sign the base64 of the canonical challenge.
	const expectedChallenge = encodeBase64Ascii(`AUTHORIZE|${body.timestamp_ms}|${body.nonce}`);
	expect(signedMessage).toBe(expectedChallenge);
});

test("authorizeWithOidc uses a caller-supplied nonce and POSTs the token body", async () => {
	const client = new UserClient(config);
	const res = await client.authorizeWithOidc("id-token-xyz", { nonce: "login-nonce" });

	expect(res).toEqual({ token: TOKEN, user_id: USER_ID });
	expect(client.getToken()).toBe(TOKEN);

	const url = fetchSpy.mock.calls[0]?.[0] as string;
	expect(url).toBe("http://localhost/api/v1/authorize");

	const body = postedBody();
	expect(body.id_token).toBe("id-token-xyz");
	// The caller-supplied nonce must be forwarded verbatim (matches Auth0 login).
	expect(body.nonce).toBe("login-nonce");
	expect(typeof body.timestamp_ms).toBe("number");
	// No signature material in the OIDC flow.
	expect(body.signature).toBeUndefined();
	expect(body.public_key).toBeUndefined();
	expect(body.party_id).toBeUndefined();
});

test("authorizeWithOidc generates a nonce when none is supplied", async () => {
	const client = new UserClient(config);
	await client.authorizeWithOidc("id-token-xyz");

	const body = postedBody();
	expect(body.id_token).toBe("id-token-xyz");
	expect(typeof body.nonce).toBe("string");
	expect((body.nonce as string).length).toBeGreaterThan(0);
});
