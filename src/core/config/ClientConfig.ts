export interface EkidenClientConfig {
  baseURL: string;
  wsURL?: string;
  privateWSURL?: string;
  apiPrefix: string;
}

export const TESTNET: EkidenClientConfig = {
  baseURL: "https://api.staging.ekiden.fi",
  wsURL: "wss://api.staging.ekiden.fi/ws/public",
  privateWSURL: "wss://api.staging.ekiden.fi/ws/private",
  apiPrefix: "/api/v1",
};

export const MAINNET: EkidenClientConfig = {
  baseURL: "https://api.ekiden.fi",
  wsURL: "wss://api.ekiden.fi/ws/public",
  privateWSURL: "wss://api.ekiden.fi/ws/private",
  apiPrefix: "/api/v1",
};
