import { ValidationError } from "./errors";

import type { SendIntentParams } from "@/modules/order";

export class Validator {
  static validateNonce(nonce: number): void {
    if (!Number.isInteger(nonce) || nonce < 0) {
      throw new ValidationError("Nonce must be a non-negative integer", "nonce");
    }
  }

  static validateSignature(signature: string): void {
    if (!signature || typeof signature !== "string") {
      throw new ValidationError("Signature must be a non-empty string", "signature");
    }
    if (!signature.startsWith("0x")) {
      throw new ValidationError("Signature must start with 0x", "signature");
    }
  }

  static validateIntentParams(params: SendIntentParams): void {
    Validator.validateNonce(params.nonce);
    Validator.validateSignature(params.signature);

    if (!params.payload) {
      throw new ValidationError("Payload is required", "payload");
    }

    if (!params.payload.type) {
      throw new ValidationError("Payload type is required", "payload.type");
    }
  }

  static validateMarketAddress(address: string): void {
    if (!address || typeof address !== "string") {
      throw new ValidationError("Market address must be a non-empty string", "market_addr");
    }
    if (!address.startsWith("0x")) {
      throw new ValidationError("Market address must start with 0x", "market_addr");
    }
  }

  static validateLeverage(leverage: number): void {
    if (!Number.isInteger(leverage) || leverage < 1) {
      throw new ValidationError("Leverage must be a positive integer", "leverage");
    }
  }

  static validatePaginationParams(params: {
    page?: number;
    per_page?: number;
  }): void {
    if (params.page !== undefined) {
      if (!Number.isInteger(params.page) || params.page < 1) {
        throw new ValidationError("Page must be a positive integer", "page");
      }
    }
    if (params.per_page !== undefined) {
      if (!Number.isInteger(params.per_page) || params.per_page < 1 || params.per_page > 100) {
        throw new ValidationError("Per page must be between 1 and 100", "per_page");
      }
    }
  }
}
