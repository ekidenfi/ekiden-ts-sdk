import { Aptos } from "@aptos-labs/ts-sdk";
import { AptosClient } from "aptos";

export interface OptionsEkiden {
  wallet?: string;
}

export interface OptionsWriteEvent {
  options: OptionsEkiden;
  provider: Aptos;
}

export interface OptionsReadEvent {
  options: OptionsEkiden;
  provider: Aptos;
  clientProvider: AptosClient;
}

type MoveStructTag = string;

type MoveStructValue = object;

export type MoveResource = {
  type: MoveStructTag;
  data: MoveStructValue;
};
