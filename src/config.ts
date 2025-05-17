import type { Aptos } from "@aptos-labs/ts-sdk";

export type EkidenClientConfig = {
  baseURL: string;
  aptos?: Aptos;
  aptosClient?: AptosClient;
  wallet?: string;
};

export const MAINNET: EkidenClientConfig = {
  baseURL: "https://api.ekiden.fi",
}

export const TESTNET: EkidenClientConfig = {
  baseURL: "https://api.ekiden.fi",
}


export interface VaultOptions {
  wallet?: string;
}

export type VaultResource = {
  type: string;
  data: object;
};
