import { HexInput, Signature } from "@aptos-labs/ts-sdk";

import { BN } from "./BN";
import { generateOrderSid } from "./generateOrderSid";

import { BuildOrderParams, CreateOrderParams, MarketShort } from "@/types";

interface BuildSignedOrderParams {
  userAddress: string;
  market: MarketShort;
  order: BuildOrderParams;
  sign: (message: HexInput) => Signature;
}

export const buildSignedOrderParams = ({
  userAddress,
  market,
  order,
  sign,
}: BuildSignedOrderParams): CreateOrderParams => {
  const nonce = Math.floor(Date.now() / 1000);

  const sid = generateOrderSid({
    marketAddr: market.address,
    userAddr: userAddress,
    side: order.side,
    size: BigInt(order.size),
    price: BigInt(order.price),
    type: order.type,
    nonce,
  });

  const hexDigest = new TextEncoder().encode(sid);
  const signature = sign(hexDigest);

  const priceFormat = BN.formatUnits(
    order.price,
    market.quote_decimals,
  ).toNumber();
  const sizeFormat = BN.formatUnits(
    order.size,
    market.base_decimals,
  ).toNumber();

  const params = {
    market_addr: market.address,
    side: order.side,
    size: sizeFormat,
    price: priceFormat,
    type: order.type,
    nonce,
    signature: signature.toString().slice(2),
  } satisfies CreateOrderParams;

  return params;
};
