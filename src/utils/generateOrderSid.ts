import { sha3_256 } from "@noble/hashes/sha3";
import { utf8ToBytes } from "@noble/hashes/utils";

export interface OrderParams {
  marketAddr: string;
  userAddr: string;
  side: string;
  size: number | bigint;
  price: number | bigint;
  type: string;
  nonce: number | bigint;
}

const toLittleEndianBytes = (
  num: number | bigint,
  byteLength = 8,
): Uint8Array => {
  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);

  if (typeof num === "bigint") {
    let temp = num;
    for (let i = 0; i < byteLength; i++) {
      view.setUint8(i, Number(temp & 0xffn));
      temp >>= 8n;
    }
  } else {
    view.setBigUint64(0, BigInt(num), true);
  }

  return new Uint8Array(buffer);
};

export const generateOrderSid = ({
  marketAddr,
  userAddr,
  side,
  size,
  price,
  type,
  nonce,
}: OrderParams): string => {
  const parts: Uint8Array[] = [
    utf8ToBytes(marketAddr),
    utf8ToBytes(userAddr),
    utf8ToBytes(side),
    toLittleEndianBytes(size),
    toLittleEndianBytes(price),
    utf8ToBytes(type),
    toLittleEndianBytes(nonce),
  ];

  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const data = new Uint8Array(totalLength);

  parts.reduce((offset, part) => {
    data.set(part, offset);
    return offset + part.length;
  }, 0);

  const hash = sha3_256(data);

  return Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
