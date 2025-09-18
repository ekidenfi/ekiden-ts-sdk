export type EkidenClientConfig = {
  baseURL: string;
  wsURL?: string;
  privateWSURL?: string;
};

// export const MAINNET: EkidenClientConfig = {
//   baseURL: "https://api.ekiden.fi",
//   wsURL: "wss://api.ekiden.fi/ws",
// };

export const TESTNET: EkidenClientConfig = {
  baseURL: "https://api.staging.ekiden.fi",
  wsURL: "wss://api.staging.ekiden.fi/ws/public",
  privateWSURL: "wss://api.staging.ekiden.fi/ws/private",
};

export interface VaultOptions {
  wallet?: string;
}

export type VaultResource = {
  type: string;
  data: object;
};
