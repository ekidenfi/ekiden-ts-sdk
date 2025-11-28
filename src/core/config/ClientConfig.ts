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

export interface VaultOptions {
  wallet?: string;
}

export type VaultResource = {
  type: string;
  data: object;
};
