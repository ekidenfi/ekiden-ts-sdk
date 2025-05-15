export type EkidenConfig = {
  baseURL: string;
  wsURL?: string;
};

export const MAINNET: EkidenConfig = {
  baseURL: "https://api.ekiden.fi",
  wsURL: "wss://api.ekiden.fi/v1",
};
export const TESTNET: EkidenConfig = {
  baseURL: "https://api.testnet.ekiden.fi",
  wsURL: "wss://api.testnet.ekiden.fi/v1",
};
