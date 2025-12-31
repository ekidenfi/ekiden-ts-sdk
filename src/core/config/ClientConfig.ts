export interface EkidenClientConfig {
  baseURL: string;
  wsURL?: string;
  privateWSURL?: string;
  apiPrefix: string;
  contractAddress: string;
}

export const TESTNET: EkidenClientConfig = {
  baseURL: "https://api.staging.ekiden.fi",
  wsURL: "wss://api.staging.ekiden.fi/ws/public",
  privateWSURL: "wss://api.staging.ekiden.fi/ws/private",
  apiPrefix: "/api/v1",
  contractAddress: "0x1f318bcba992874f5cb939cd9e66cbe16cfbe89323ee91b7e98e1cc8411cd1d7",
};

export const MAINNET: EkidenClientConfig = {
  baseURL: "https://api.ekiden.fi",
  wsURL: "wss://api.ekiden.fi/ws/public",
  privateWSURL: "wss://api.ekiden.fi/ws/private",
  apiPrefix: "/api/v1",
  contractAddress: "0x1f318bcba992874f5cb939cd9e66cbe16cfbe89323ee91b7e98e1cc8411cd1d7",
};
