import type { EkidenClientConfig } from "@/core/config";
import { APIError, AuthenticationError } from "@/core/errors";

export type UnauthorizedCallback = () => void;

export type ApiKeySignContext = {
	method: string;
	pathAndQuery: string;
	timestampMs: number;
	nonce: string;
	message: string;
};

export type ApiKeySigner = (
	messageBytes: Uint8Array,
	context: ApiKeySignContext
) => string | Promise<string>;

export interface ApiKeyAuthConfig {
	publicKey: string;
	sign: ApiKeySigner;
	nonce?: () => string;
	timestampMs?: () => number;
}

let globalUnauthorizedCallback: UnauthorizedCallback | null = null;

export const setUnauthorizedCallback = (callback: UnauthorizedCallback | null): void => {
	globalUnauthorizedCallback = callback;
};

export const getUnauthorizedCallback = (): UnauthorizedCallback | null => {
	return globalUnauthorizedCallback;
};

export class BaseHttpClient {
	protected token?: string;
	protected apiKeyAuth?: ApiKeyAuthConfig;

	constructor(protected readonly config: EkidenClientConfig) {}

	protected get baseURL(): string {
		return this.config.baseURL;
	}

	protected get apiPrefix(): string {
		return this.config.apiPrefix;
	}

	public setToken(token: string): void {
		this.token = token;
	}

	public setApiKeyAuth(config: ApiKeyAuthConfig): void {
		this.apiKeyAuth = config;
	}

	public clearApiKeyAuth(): void {
		this.apiKeyAuth = undefined;
	}

	public getToken(): string | undefined {
		return this.token;
	}

	protected async authHeaders(
		method: string,
		pathAndQuery: string
	): Promise<Record<string, string>> {
		if (this.token) {
			return { Authorization: `Bearer ${this.token}` };
		}

		if (!this.apiKeyAuth) {
			return {};
		}

		const timestampMs = this.apiKeyAuth.timestampMs
			? this.apiKeyAuth.timestampMs()
			: Date.now();
		const nonce = this.apiKeyAuth.nonce ? this.apiKeyAuth.nonce() : this.defaultNonce();
		const message = `EKIDEN_API|${method}|${pathAndQuery}|${timestampMs}|${nonce}`;

		const signature = await this.apiKeyAuth.sign(new TextEncoder().encode(message), {
			method,
			pathAndQuery,
			timestampMs,
			nonce,
			message,
		});

		return {
			"X-API-KEY": this.apiKeyAuth.publicKey,
			"X-SIGNATURE": signature,
			"X-TIMESTAMP-MS": String(timestampMs),
			"X-NONCE": nonce,
		};
	}

	protected ensureAuth(): void {
		if (!this.token && !this.apiKeyAuth) {
			throw new AuthenticationError();
		}
	}

	private defaultNonce(): string {
		if (typeof globalThis.crypto?.getRandomValues === "function") {
			const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
			return Array.from(bytes)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
		}

		return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}

	protected async post<T>(
		path: string,
		params: Record<string, any>,
		options: { auth?: boolean } = {}
	): Promise<T> {
		const { auth = true } = options;
		if (auth) this.ensureAuth();
		return this.request<T>(
			path,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(params),
			},
			{ auth }
		);
	}

	protected async request<T>(
		path: string,
		options: RequestInit = {},
		config: {
			auth?: boolean;
			query?: Record<string, any>;
		} = {}
	): Promise<T> {
		const { auth = false, query } = config;

		const url = this.buildUrl(path, query);
		const method = (options.method || "GET").toUpperCase();
		const parsed = new URL(url);
		let canonicalPath = parsed.pathname;
		if (this.apiPrefix && canonicalPath.startsWith(this.apiPrefix)) {
			canonicalPath = canonicalPath.slice(this.apiPrefix.length);
			if (!canonicalPath.startsWith("/")) {
				canonicalPath = `/${canonicalPath}`;
			}
		}
		const pathAndQuery = `${canonicalPath}${parsed.search}`;
		const authHeaders = auth ? await this.authHeaders(method, pathAndQuery) : {};

		const headers: HeadersInit = {
			...(options.headers || {}),
			...authHeaders,
		};

		const response = await fetch(url, { ...options, headers });

		if (!response.ok) {
			let errorResponseContent = "";

			try {
				const rawText = await response.text();
				try {
					const errorData = JSON.parse(rawText);
					const parts: string[] = [];
					if (errorData.error) parts.push(errorData.error);
					if (errorData.message) parts.push(errorData.message);

					if (parts.length > 0) {
						errorResponseContent = parts.join(": ");
					} else if (typeof errorData === "string") {
						errorResponseContent = errorData;
					}
				} catch {
					if (rawText) {
						errorResponseContent = rawText;
					}
				}
			} catch {
				// Ignore error parsing failures
			}

			// Handle 401 Unauthorized - trigger re-sign dialog
			if (response.status === 401 && globalUnauthorizedCallback) {
				globalUnauthorizedCallback();
			}

			throw new APIError(
				errorResponseContent || `${method} ${path} failed`,
				response.status,
				path
			);
		}

		if (response.status === 204) {
			return undefined as T;
		}

		const rawText = await response.text();
		if (!rawText) {
			return undefined as T;
		}

		try {
			return JSON.parse(rawText) as T;
		} catch {
			return rawText as T;
		}
	}

	protected buildUrl(path: string, query?: Record<string, any>): string {
		const url = new URL(`${this.baseURL}${this.apiPrefix}${path}`);
		if (query) {
			Object.entries(query).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== "") {
					if (Array.isArray(value)) {
						value.forEach((v) => {
							url.searchParams.append(key, String(v));
						});
					} else {
						url.searchParams.append(key, String(value));
					}
				}
			});
		}
		return url.toString();
	}
}
