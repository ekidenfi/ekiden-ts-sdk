export type EkidenClientConfig = {
  baseURL: string;
  wsURL?: string; // Optional WebSocket endpoint
};

// export const MAINNET: EkidenClientConfig = {
//   baseURL: "https://api.ekiden.fi",
//   wsURL: "wss://api.ekiden.fi/ws",
// };

export const TESTNET: EkidenClientConfig = {
  baseURL: "https://api.staging.ekiden.fi/api/v1",
  wsURL: "wss://api.staging.ekiden.fi/ws",
};

export interface VaultOptions {
  wallet?: string;
}

export type VaultResource = {
  type: string;
  data: object;
};
