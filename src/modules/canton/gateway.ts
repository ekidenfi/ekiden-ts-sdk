/**
 * Client for the Ekiden Canton Gateway read endpoints (`/account`, `/balance`, `/holdings`,
 * `/getContracts`, `/state/ledger-end`).
 *
 * The account/balance/holdings endpoints are per-user and authenticated: the gateway resolves
 * the caller's party from the bearer token and refuses a partyId that is not theirs. This client
 * therefore attaches `Authorization: Bearer <token>` to every request via the injected
 * getAccessToken callback. fetch is injectable so the auth behaviour is testable without network.
 */

export interface CantonGatewayBalance {
	amount: string;
}

export interface CantonGatewayHolding {
	contractId: string;
	amount: string;
	createdEventBlob: string;
	templateId: string;
}

export interface CantonGatewayLedgerEnd {
	offset: number;
}

export interface CantonGatewayActiveContract {
	createdEvent: {
		contractId: string;
		templateId: string;
		[key: string]: unknown;
	};
	synchronizerId: string;
	reassignmentCounter: number;
}

export interface CantonGatewayContractsResponse {
	contracts: CantonGatewayActiveContract[];
}

export interface CantonGatewayAccount {
	partyId: string;
	registered: boolean;
	balance: CantonGatewayBalance;
	holdings: CantonGatewayHolding[];
	[key: string]: unknown;
}

export interface GetContractsParams {
	partyId?: string;
	templateId?: string;
	signatories?: string;
}

/** The minimal fetch surface this client needs; native fetch and test mocks both satisfy it. */
export type GatewayFetch = (
	input: string,
	init?: { headers?: Record<string, string> }
) => Promise<Response>;

export interface CantonGatewayClientConfig {
	/** Base URL of the canton gateway, e.g. https://app.canton.ekiden.fi. */
	baseUrl: string;
	/** Returns the current bearer (Auth0 access) token, or null/undefined when unauthenticated. */
	getAccessToken?: () => string | null | undefined;
	/** Injectable fetch, mainly for testing; defaults to the global fetch. */
	fetchFn?: GatewayFetch;
}

export class CantonGatewayClient {
	private readonly baseUrl: string;
	private readonly getAccessToken: () => string | null | undefined;
	private readonly fetchFn: GatewayFetch;

	constructor(config: CantonGatewayClientConfig) {
		this.baseUrl = config.baseUrl.replace(/\/$/, "");
		this.getAccessToken = config.getAccessToken ?? (() => undefined);
		this.fetchFn = config.fetchFn ?? ((input, init) => globalThis.fetch(input, init));
	}

	private request = async <T>(
		path: string,
		params?: Record<string, string | undefined>
	): Promise<T> => {
		const url = new URL(`${this.baseUrl}${path}`);
		if (params) {
			for (const [key, value] of Object.entries(params)) {
				if (value != null && value !== "") {
					url.searchParams.set(key, value);
				}
			}
		}

		const headers: Record<string, string> = {};
		const token = this.getAccessToken();
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		const response = await this.fetchFn(url.toString(), { headers });
		if (!response.ok) {
			throw new Error(`Canton Gateway request failed (${response.status}): ${path}`);
		}
		return (await response.json()) as T;
	};

	getAccount = (partyId: string): Promise<CantonGatewayAccount> => {
		return this.request<CantonGatewayAccount>("/account", { partyId });
	};

	getContracts = ({
		partyId,
		templateId,
		signatories,
	}: GetContractsParams = {}): Promise<CantonGatewayContractsResponse> => {
		return this.request<CantonGatewayContractsResponse>("/getContracts", {
			partyId,
			templateId,
			signatories,
		});
	};

	getBalance = (partyId: string): Promise<CantonGatewayBalance> => {
		return this.request<CantonGatewayBalance>("/balance", { partyId });
	};

	getHoldings = (partyId: string): Promise<CantonGatewayHolding[]> => {
		return this.request<CantonGatewayHolding[]>("/holdings", { partyId });
	};

	getLedgerEnd = (): Promise<CantonGatewayLedgerEnd> => {
		return this.request<CantonGatewayLedgerEnd>("/state/ledger-end");
	};
}
