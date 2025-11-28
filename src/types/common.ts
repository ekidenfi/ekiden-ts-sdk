export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface AuthorizeParams {
  signature: string;
  public_key: string;
  timestamp_ms: number;
  nonce: string;
  full_message?: string;
}

export interface AuthorizeResponse {
  token: string;
}

export type VaultType =
  | "Ekiden"
  | "Insurance"
  | "Funding"
  | "Cross"
  | "Isolated";
