export class EkidenSDKError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "EkidenSDKError";
		Object.setPrototypeOf(this, EkidenSDKError.prototype);
	}
}

export class AuthenticationError extends EkidenSDKError {
	constructor(message = "Not authenticated") {
		super(message);
		this.name = "AuthenticationError";
		Object.setPrototypeOf(this, AuthenticationError.prototype);
	}
}

export class WebSocketError extends EkidenSDKError {
	constructor(message: string) {
		super(message);
		this.name = "WebSocketError";
		Object.setPrototypeOf(this, WebSocketError.prototype);
	}
}

export class APIError extends EkidenSDKError {
	constructor(
		message: string,
		public statusCode?: number,
		public endpoint?: string,
		/**
		 * Stable machine-readable discriminator from the error body — the gateway's `code`
		 * (e.g. `CANTON_PARTY_NOT_PROVISIONED`, `ROOT_ADDRESS_NOT_WHITELISTED`) or another
		 * service's `error`. Branch on this rather than matching `message`, which is prose
		 * and may be reworded at any time.
		 */
		public code?: string
	) {
		super(message);
		this.name = "APIError";
		Object.setPrototypeOf(this, APIError.prototype);
	}
}

export class ValidationError extends EkidenSDKError {
	constructor(
		message: string,
		public field?: string
	) {
		super(message);
		this.name = "ValidationError";
		Object.setPrototypeOf(this, ValidationError.prototype);
	}
}

export class ConfigurationError extends EkidenSDKError {
	constructor(message: string) {
		super(message);
		this.name = "ConfigurationError";
		Object.setPrototypeOf(this, ConfigurationError.prototype);
	}
}
