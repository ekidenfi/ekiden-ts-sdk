import { EkidenClientConfig } from "@/config";
import type {
  AuthorizeParams,
  AuthorizeResponse,
  CandleResponse,
  FillResponse,
  FundingEpochResponse,
  FundingRateResponse,
  GetFundingRateParams,
  ListCandlesParams,
  ListFillsParams,
  ListOrdersParams,
  ListPositionsParams,
  ListUserFillsParams,
  ListUserOrdersParams,
  ListVaultsParams,
  MarketResponse,
  MarketStatsResponse,
  OrderResponse,
  PortfolioResponse,
  PositionResponse,
  SendIntentParams,
  SendIntentResponse,
  SendIntentWithCommitResponse,
  UserLeverageParams,
  VaultResponse,
} from "@/types";

export class HttpClient {
  private token?: string;

  constructor(readonly config: EkidenClientConfig) {}

  private get baseURL() {
    return this.config.baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private authHeader(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  private ensureAuth() {
    if (!this.token) throw new Error("Not authenticated");
  }

  private async request<T>(
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

      // Try to get error details from response body
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
      } catch {
        // ignore
      }

      throw new Error(`${errorMessage}: ${errorResponseContent}`);
    }

    return response.json();
  }

  private buildUrl(path: string, query?: Record<string, any>): string {
    const url = new URL(`${this.baseURL}${path}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  async authorize(params: AuthorizeParams): Promise<AuthorizeResponse> {
    const data = await this.request<AuthorizeResponse>("/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async getMarkets(): Promise<MarketResponse[]> {
    return this.request<MarketResponse[]>("/market/markets");
  }

  async getOrders(params: ListOrdersParams): Promise<OrderResponse[]> {
    return this.request<OrderResponse[]>(
      "/market/orders",
      {},
      { query: params },
    );
  }

  async getFills(params: ListFillsParams): Promise<FillResponse[]> {
    return this.request<FillResponse[]>("/market/fills", {}, { query: params });
  }

  async getUserOrders(
    params: ListUserOrdersParams = {},
  ): Promise<OrderResponse[]> {
    this.ensureAuth();
    return this.request<OrderResponse[]>(
      "/user/orders",
      {},
      { auth: true, query: params },
    );
  }

  async getUserFills(
    params: ListUserFillsParams = {},
  ): Promise<FillResponse[]> {
    this.ensureAuth();
    return this.request<FillResponse[]>(
      "/user/fills",
      {},
      { auth: true, query: params },
    );
  }

  async getUserVaults(params: ListVaultsParams = {}): Promise<VaultResponse[]> {
    this.ensureAuth();
    return this.request<VaultResponse[]>(
      "/user/vaults",
      {},
      { auth: true, query: params },
    );
  }

  async getUserPositions(
    params: ListPositionsParams = {},
  ): Promise<PositionResponse[]> {
    this.ensureAuth();
    return this.request<PositionResponse[]>(
      "/user/positions",
      {},
      { auth: true, query: params },
    );
  }

  async sendIntent(params: SendIntentParams): Promise<SendIntentResponse> {
    this.ensureAuth();
    return this.request<SendIntentResponse>(
      "/user/intent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true },
    );
  }

  async sendIntentWithCommit(
    params: SendIntentParams,
  ): Promise<SendIntentWithCommitResponse> {
    this.ensureAuth();
    return this.request<SendIntentWithCommitResponse>(
      "/user/intent/commit",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true },
    );
  }

  async getFundingRates(
    params: GetFundingRateParams = {},
  ): Promise<FundingRateResponse[]> {
    return this.request<FundingRateResponse[]>(
      "/market/funding_rate",
      {},
      { query: params },
    );
  }

  async getFundingRateByMarket(
    marketAddr: string,
  ): Promise<FundingRateResponse> {
    return this.request<FundingRateResponse>(
      `/market/funding_rate/${marketAddr}`,
    );
  }

  async getFundingEpoch(): Promise<FundingEpochResponse> {
    return this.request<FundingEpochResponse>("/market/funding_rate/epoch");
  }

  async getCandles(params: ListCandlesParams): Promise<CandleResponse[]> {
    return this.request<CandleResponse[]>(
      "/market/candles",
      {},
      { query: params },
    );
  }

  async getMarketStats(marketAddr: string): Promise<MarketStatsResponse> {
    return this.request<MarketStatsResponse>(
      `/market/candles/stats/${marketAddr}`,
    );
  }

  async getUserPortfolio(): Promise<PortfolioResponse> {
    this.ensureAuth();
    return this.request<PortfolioResponse>(
      "/user/portfolio",
      {},
      { auth: true },
    );
  }

  async setUserLeverage(
    params: UserLeverageParams,
  ): Promise<PortfolioResponse> {
    this.ensureAuth();
    return this.request<PortfolioResponse>(
      "/user/leverage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true },
    );
  }
}
