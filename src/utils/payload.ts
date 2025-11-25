import { Serializer } from "@aptos-labs/ts-sdk";

import { INTENT_SEED, TPSL_MODE, TPSL_ORDER_TYPE } from "@/core/constants";
import { ActionPayload } from "@/modules/order";

const encodeTpSlMode = (mode: string): number =>
  mode === "FULL" ? TPSL_MODE.FULL : TPSL_MODE.PARTIAL;
const encodeTpSlOrderType = (orderType: string): number =>
  orderType === "MARKET" ? TPSL_ORDER_TYPE.MARKET : TPSL_ORDER_TYPE.LIMIT;

export const buildOrderPayload = ({
  payload,
  nonce,
}: {
  payload: ActionPayload;
  nonce: number;
}) => {
  const serializer = new Serializer();

  serializer.serializeStr(payload.type);

  if (payload.type === "leverage_assign") {
    serializer.serializeU64(BigInt(payload.leverage));
    serializer.serializeStr(payload.market_addr);
  } else if (payload.type === "order_cancel") {
    const cancels = payload.cancels;
    serializer.serializeU32AsUleb128(cancels.length);
    for (const cancel of cancels) {
      serializer.serializeStr(cancel.sid);
    }
  } else if (payload.type === "order_cancel_all") {
    // No additional fields to serialize
  } else if (payload.type === "order_create") {
    const orders = payload.orders;
    serializer.serializeU32AsUleb128(orders.length);

    for (const order of orders) {
      serializer.serializeStr(order.side);
      serializer.serializeU64(BigInt(order.size));
      serializer.serializeU64(BigInt(order.price));
      serializer.serializeU64(BigInt(order.leverage));
      serializer.serializeStr(order.type);
      serializer.serializeStr(order.market_addr);
      serializer.serializeBool(order.is_cross);
      serializer.serializeOption<string>(order.time_in_force);

      if (order.trigger_price !== undefined && order.trigger_price !== null) {
        serializer.serializeU8(1);
        serializer.serializeU64(BigInt(order.trigger_price));
      }

      if (order.reduce_only !== undefined && order.reduce_only !== null) {
        serializer.serializeU8(1);
        serializer.serializeBool(Boolean(order.reduce_only));
      }

      if (order.order_link_id !== undefined && order.order_link_id !== null) {
        serializer.serializeU8(1);
        serializer.serializeStr(order.order_link_id);
      }

      if (order.bracket) {
        serializer.serializeU8(1);
        const bracket = order.bracket;
        serializer.serializeU32AsUleb128(encodeTpSlMode(bracket.mode));

        if (!bracket.take_profit) {
          serializer.serializeU8(0);
        } else {
          serializer.serializeU8(1);
          serializer.serializeU64(BigInt(bracket.take_profit.trigger_price));
          serializer.serializeU32AsUleb128(
            encodeTpSlOrderType(bracket.take_profit.order_type),
          );
          if (
            bracket.take_profit.limit_price === undefined ||
            bracket.take_profit.limit_price === null
          ) {
            serializer.serializeU8(0);
          } else {
            serializer.serializeU8(1);
            serializer.serializeU64(BigInt(bracket.take_profit.limit_price));
          }
        }

        if (!bracket.stop_loss) {
          serializer.serializeU8(0);
        } else {
          serializer.serializeU8(1);
          serializer.serializeU64(BigInt(bracket.stop_loss.trigger_price));
          serializer.serializeU32AsUleb128(
            encodeTpSlOrderType(bracket.stop_loss.order_type),
          );
          if (
            bracket.stop_loss.limit_price === undefined ||
            bracket.stop_loss.limit_price === null
          ) {
            serializer.serializeU8(0);
          } else {
            serializer.serializeU8(1);
            serializer.serializeU64(BigInt(bracket.stop_loss.limit_price));
          }
        }
      } else {
        // No bracket specified
      }
    }
  } else {
    throw new Error(`Unknown action type: ${(payload as any).type}`);
  }

  return composeHexPayload({
    payload: serializer.toUint8Array(),
    nonce,
  });
};

const composeHexPayload = ({
  payload,
  nonce,
}: {
  payload: Uint8Array;
  nonce: number;
}) => {
  const serializeNonce = (nonce: number) => {
    const serializer = new Serializer();
    serializer.serializeU64(nonce);
    return serializer.toUint8Array();
  };

  const nonceBytes = serializeNonce(nonce);

  const totalLength = INTENT_SEED.length + payload.length + nonceBytes.length;
  const result = new Uint8Array(totalLength);

  result.set(INTENT_SEED, 0);
  result.set(payload, INTENT_SEED.length);
  result.set(nonceBytes, INTENT_SEED.length + payload.length);

  return Array.from(result)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};
