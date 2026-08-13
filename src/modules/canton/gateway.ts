import type { CantonHolding } from "./types";

const readObj = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== "object") return {};
	return value as Record<string, unknown>;
};

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export interface CantonGatewayCreatedEvent {
	contractId: string;
	templateId: string;
	createArgument: Record<string, unknown>;
	createdEventBlob: string;
	signatories?: string[];
	observers?: string[];
	[key: string]: unknown;
}

export interface CantonGatewayContract {
	createdEvent: CantonGatewayCreatedEvent;
	synchronizerId?: string;
	[key: string]: unknown;
}

export interface CantonGatewayContractsResponse {
	contracts: CantonGatewayContract[];
}

export interface GetContractsParams {
	partyId?: string;
	templateId?: string;
	signatories?: string;
}

/**
 * Client for the Ekiden Canton Gateway ACS/index HTTP API
 * (`/holdings`, `/getContracts`, …).
 */
export class CantonGatewayClient {
	constructor(private readonly baseUrl: string) {}

	private get root(): string {
		return this.baseUrl.replace(/\/$/, "");
	}

	private async request<T>(
		path: string,
		params?: Record<string, string | undefined>
	): Promise<T> {
		const url = new URL(`${this.root}${path}`);
		if (params) {
			for (const [key, value] of Object.entries(params)) {
				if (value != null && value !== "") {
					url.searchParams.set(key, value);
				}
			}
		}

		const response = await fetch(url.toString());
		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`Canton Gateway request failed (${response.status}): ${path}${errorBody ? ` — ${errorBody}` : ""}`
			);
		}
		return response.json() as Promise<T>;
	}

	async getContracts(params: GetContractsParams = {}): Promise<CantonGatewayContractsResponse> {
		const payload = await this.request<CantonGatewayContractsResponse>("/getContracts", {
			partyId: params.partyId,
			templateId: params.templateId,
			signatories: params.signatories,
		});
		const contracts = toArray(payload.contracts).map((entry) => {
			const contract = readObj(entry);
			const createdEvent = readObj(contract.createdEvent);
			return {
				...contract,
				createdEvent: {
					...createdEvent,
					contractId: String(createdEvent.contractId || ""),
					templateId: String(createdEvent.templateId || ""),
					createArgument: readObj(createdEvent.createArgument),
					createdEventBlob: String(createdEvent.createdEventBlob || ""),
				},
				synchronizerId: String(contract.synchronizerId || ""),
			} as CantonGatewayContract;
		});
		return { contracts };
	}

	async getHoldings(partyId: string, templateId?: string): Promise<CantonHolding[]> {
		const payload = await this.request<unknown[]>("/holdings", {
			partyId,
			templateId,
		});
		return toArray(payload)
			.map((entry) => {
				const holding = readObj(entry);
				const contractId = String(holding.contractId || "");
				const createdEventBlob = String(holding.createdEventBlob || "");
				const holdingTemplateId = String(holding.templateId || "");
				if (!contractId) return null;
				return {
					contractId,
					amount: String(holding.amount || "0"),
					createdEventBlob,
					templateId: holdingTemplateId,
				} satisfies CantonHolding;
			})
			.filter((holding): holding is CantonHolding => holding != null);
	}
}
