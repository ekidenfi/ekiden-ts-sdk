export const HEARTBEAT_INTERVAL_MS = 20000;

export const DEFAULT_REQUEST_TIMEOUT_MS = 120000;

export const INTENT_SEED = Uint8Array.from([
  226, 172, 78, 86, 136, 217, 100, 39, 10, 216, 118, 215, 96, 194, 235, 178, 213, 79, 178, 109, 147,
  81, 44, 121, 0, 73, 182, 88, 55, 48, 208, 111,
]);

export const ADDRESS_HEX_LENGTH = 64;

export const TPSL_MODE = {
  FULL: 0,
  PARTIAL: 1,
} as const;

export const TPSL_ORDER_TYPE = {
  MARKET: 0,
  LIMIT: 1,
} as const;
