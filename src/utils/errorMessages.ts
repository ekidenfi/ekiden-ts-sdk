import type { RejectReason } from "@/types/api";

/**
 * Map of Ekiden backend error codes to human-readable messages
 */
export const ORDER_ERROR_MESSAGES: Record<RejectReason, string> = {
	// Success / No error
	EcNoError: "",

	// Funds & Balance
	EcInsufficientFunds: "Insufficient funds. Please deposit more or reduce order size.",
	EcNoEnoughQtyToFill: "Not enough quantity available to fill your order.",
	EcNoImmediateQtyToFill: "No immediate liquidity available at this price.",

	// Price errors
	EcLimitOrderInvalidPrice: "Invalid limit price. Please check the price and try again.",
	EcMarketOrderPriceIsNotZero: "Market orders should not have a price set.",
	EcInvalidPriceScale: "Invalid price precision. Please adjust the price.",
	EcReachRiskPriceLimit: "Price exceeds risk limits.",
	EcReachMarketPriceLimit: "Price exceeds market limits.",

	// Order type & configuration
	EcUnknownOrderType: "Unknown order type.",
	EcUnknownSide: "Invalid order side. Must be buy or sell.",
	EcUnknownTimeInForce: "Invalid time-in-force setting.",
	EcMarketOrderCannotBePostOnly: "Market orders cannot be post-only.",
	EcPostOnlyWillTakeLiquidity: "Post-only order would take liquidity. Please adjust the price.",
	EcMarketOrderNoSupportTif: "Market orders do not support this time-in-force.",
	EcMarketQuoteNoSuppSell: "Market quote orders do not support sell side.",

	// Quantity errors
	EcQtyCannotBeZero: "Order quantity cannot be zero.",
	EcEcInvalidQty: "Invalid order quantity.",
	EcInvalidAmount: "Invalid order amount.",
	EcInvalidBaseValue: "Invalid base value.",

	// Order ID errors
	EcMissingClOrdId: "Missing client order ID.",
	EcMissingOrigClOrdId: "Missing original client order ID.",
	EcClOrdIdOrigClOrdIdAreTheSame: "Client order ID and original ID cannot be the same.",
	EcDuplicatedClOrdId: "Duplicate client order ID.",
	EcOrigClOrdIdDoesNotExist: "Original order does not exist.",
	EcOrderNotExist: "Order does not exist.",
	EcDisorderOrderId: "Invalid order ID sequence.",

	// Cancel errors
	EcTooLateToCancel: "Too late to cancel this order.",
	EcPerCancelRequest: "Order cancelled by request.",
	EcCancelReplaceOrder: "Order cancelled for replacement.",
	EcCancelForNoFullFill: "Order cancelled due to partial fill.",
	EcCancelByMmp: "Order cancelled by market maker protection.",
	EcLoadOrderCancel: "Order cancelled during loading.",
	EcCancelByOrderValueZero: "Order cancelled due to zero value.",
	EcCancelByMatchValueZero: "Order cancelled due to zero match value.",

	// Self-match prevention
	EcBySelfMatch: "Order would match against your own order.",
	EcStopBySelfMatch: "Stop order blocked by self-match prevention.",
	EcInvalidSmpType: "Invalid self-match prevention type.",

	// Market status
	EcInvalidSymbolStatus: "Market is currently not available for trading.",
	EcInCallAuctionStatus: "Market is in auction mode.",
	EcSecurityStatusFail: "Security status check failed.",

	// System limits
	EcReachMaxTradeNum: "Maximum number of trades reached.",
	EcBitIndexInvalid: "Invalid bit index.",

	// User & Mirror
	EcInvalidUserType: "Invalid user type.",
	EcInvalidMirrorOid: "Invalid mirror order ID.",
	EcInvalidMirrorUid: "Invalid mirror user ID.",

	// Routing
	EcWronglyRouted: "Order was incorrectly routed.",
	EcLoadOrderCanMatch: "Order can match during loading.",

	// Generic
	EcOthers: "An unexpected error occurred.",
	EcUnknownMessageType: "Unknown message type received.",
};

/**
 * Translates an error code to a user-friendly message
 */
export const translateOrderError = (
	errorCode: RejectReason | string | undefined | null
): string | null => {
	if (!errorCode) return null;

	// Check if error is a known error code
	const message = ORDER_ERROR_MESSAGES[errorCode as RejectReason];
	if (message !== undefined) {
		return message || null;
	}

	// Check if error message contains an error code
	for (const [code, msg] of Object.entries(ORDER_ERROR_MESSAGES)) {
		if (errorCode.includes(code) && msg) {
			return msg;
		}
	}

	return null;
};
