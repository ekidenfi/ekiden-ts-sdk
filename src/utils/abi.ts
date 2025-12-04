import {
  type EntryFunctionABI,
  type MoveFunction,
  type TypeTag,
  findFirstNonSignerArg,
  parseTypeTag,
} from "@aptos-labs/ts-sdk";

type FunctionAbi = Pick<MoveFunction, "generic_type_params" | "params">;

export const parseAbi = (functionAbi: FunctionAbi): EntryFunctionABI => {
  const numSigners = findFirstNonSignerArg(functionAbi as MoveFunction);
  const params: TypeTag[] = functionAbi.params
    .slice(numSigners)
    .map((param) => parseTypeTag(param, { allowGenerics: true }));
  return {
    typeParameters: functionAbi.generic_type_params,
    parameters: params,
    signers: numSigners,
  };
};
