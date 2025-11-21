import { Serializer } from "@aptos-labs/ts-sdk";

import { ActionPayload } from "@/types";

// Encode enums the way Rust BCS does (by variant index using ULEB128),
// matching `TpSlMode` and `TpSlOrderType` order in ekiden-core.
const encodeTpSlMode = (mode: string): number => (mode === "FULL" ? 0 : 1);
const encodeTpSlOrderType = (orderType: string): number =>
  orderType === "MARKET" ? 0 : 1;

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
    // No additional fields to serialize for cancel_all
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
      // time_in_force (Option<string>)
      serializer.serializeOption<string>(order.time_in_force);

      // trigger_price (skipped if None per #[serde(skip_serializing_if)])
      if (order.trigger_price !== undefined && order.trigger_price !== null) {
        // Some(value): write Option tag (1) + value; None is fully omitted (no 0 tag)
        serializer.serializeU8(1);
        serializer.serializeU64(BigInt(order.trigger_price));
      }

      // reduce_only (skipped if None per #[serde(skip_serializing_if)])
      if (order.reduce_only !== undefined && order.reduce_only !== null) {
        // Some(value): write Option tag (1) + value; None is fully omitted (no 0 tag)
        serializer.serializeU8(1);
        serializer.serializeBool(Boolean(order.reduce_only));
      }

      // order_link_id (skipped if None per #[serde(skip_serializing_if)])
      if (order.order_link_id !== undefined && order.order_link_id !== null) {
        // Some(value): write Option tag (1) + value; None is fully omitted (no 0 tag)
        serializer.serializeU8(1);
        serializer.serializeStr(order.order_link_id);
      }

      // bracket (Option<TpSlBracket>)
      if (order.bracket) {
        serializer.serializeU8(1);
        const bracket = order.bracket;
        // mode as enum index (ULEB128): FULL=0, PARTIAL=1
        serializer.serializeU32AsUleb128(encodeTpSlMode(bracket.mode));

        // take_profit: Option<TpSlSpec>
        if (!bracket.take_profit) {
          serializer.serializeU8(0);
        } else {
          serializer.serializeU8(1);
          serializer.serializeU64(BigInt(bracket.take_profit.trigger_price));
          // order_type as enum index (ULEB128): MARKET=0, LIMIT=1
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

        // stop_loss: Option<TpSlSpec>
        if (!bracket.stop_loss) {
          serializer.serializeU8(0);
        } else {
          serializer.serializeU8(1);
          serializer.serializeU64(BigInt(bracket.stop_loss.trigger_price));
          // order_type as enum index (ULEB128): MARKET=0, LIMIT=1
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
        // None: per #[serde(skip_serializing_if)], omit entirely (no 0 tag)
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
  const SEED = Uint8Array.from([
    226, 172, 78, 86, 136, 217, 100, 39, 10, 216, 118, 215, 96, 194, 235, 178,
    213, 79, 178, 109, 147, 81, 44, 121, 0, 73, 182, 88, 55, 48, 208, 111,
  ]);

  const serializeNonce = (nonce: number) => {
    const serializer = new Serializer();
    serializer.serializeU64(nonce);
    return serializer.toUint8Array();
  };

  const nonceBytes = serializeNonce(nonce);

  const totalLength = SEED.length + payload.length + nonceBytes.length;
  const result = new Uint8Array(totalLength);

  result.set(SEED, 0);
  result.set(payload, SEED.length);
  result.set(nonceBytes, SEED.length + payload.length);

  return Array.from(result)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};
