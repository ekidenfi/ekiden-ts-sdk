import { EkidenClientConfig } from "@/core/config";

export class BaseHttpClient {
  protected token?: string;

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

  public getToken(): string | undefined {
    return this.token;
  }

  protected authHeader(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  protected ensureAuth(): void {
    if (!this.token) throw new Error("Not authenticated");
  }

  protected async request<T>(
    path: string,
    options: RequestInit = {},
    config: {
      auth?: boolean;
      query?: Record<string, any>;
    } = {},
  ): Promise<T> {
    const { auth = false, query } = config;

    const url = this.buildUrl(path, query);

    const headers: HeadersInit = {
      ...(options.headers || {}),
      ...(auth ? this.authHeader() : {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const method = options.method || "GET";
      const errorMessage = `${method} ${path} failed with status ${response.status}`;
      let errorResponseContent = "";

      let rawText = "";
      try {
        rawText = await response.text();
        try {
          const errorData = JSON.parse(rawText);
          if (errorData.error) {
            errorResponseContent = errorData.error;
          } else if (errorData.message) {
            errorResponseContent = errorData.message;
          } else if (typeof errorData === "string") {
            errorResponseContent = errorData;
          }
        } catch {
          if (rawText) {
            errorResponseContent = rawText;
          }
        }
      } catch (e) {
        // Ignore error parsing failures
      }

      throw new Error(`${errorMessage}: ${errorResponseContent}`);
    }

    return response.json();
  }

  protected buildUrl(path: string, query?: Record<string, any>): string {
    const url = new URL(`${this.baseURL}${this.apiPrefix}${path}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }
}
