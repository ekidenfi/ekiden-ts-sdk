import { Serializer } from "@aptos-labs/ts-sdk";

import { ActionPayload } from "@/types";

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
  } else if (payload.type === "order_create") {
    const orders = payload.orders;
    serializer.serializeU32AsUleb128(orders.length);

    for (const order of orders) {
      serializer.serializeStr(order.side);
      serializer.serializeU64(BigInt(order.size));
      serializer.serializeU64(BigInt(order.price));
      serializer.serializeStr(order.type);
      serializer.serializeStr(order.market_addr);
      serializer.serializeU64(BigInt(order.leverage));
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
