import {
  type AccountAddressInput,
  type InputEntryFunctionData,
  AccountAddress,
  type EntryFunctionABI,
  type MoveFunction,
  type TypeTag,
  findFirstNonSignerArg,
  parseTypeTag,
} from "@aptos-labs/ts-sdk";

type FunctionAbi = Pick<MoveFunction, "generic_type_params" | "params">;
const parseAbi = (functionAbi: FunctionAbi): EntryFunctionABI => {
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

export const buildVaultDepositPayload = (args: {
  vaultAddress: string;
  userAddress: AccountAddressInput;
  token: string;
  amount: bigint;
}): InputEntryFunctionData => ({
  function: `${args.vaultAddress}::perpetual_vault::deposit`,
  typeArguments: [
    `${args.token}::perpetual_vault_type::UserVault`,
    `${args.token}::perpetual_collateral::PerpetualCollateral`,
  ],
  functionArguments: [
    AccountAddress.from(args.userAddress),
    args.amount,
  ],
  abi: parseAbi({
    generic_type_params: [{ constraints: [] }, { constraints: [] }],
    params: ["&signer", "address", "u64"],
  }),
});

export const buildVaultWithdrawPayload = (args: {
  vaultAddress: string;
  userAddress: AccountAddressInput;
  token: string;
  amount: bigint;
}): InputEntryFunctionData => ({
  function: `${args.vaultAddress}::perpetual_vault::withdraw`,
  typeArguments: [
    `${args.token}::perpetual_vault_type::UserVault`,
    `${args.token}::perpetual_collateral::PerpetualCollateral`,
  ],
  functionArguments: [
    AccountAddress.from(args.userAddress),
    args.amount,
  ],
  abi: parseAbi({
    generic_type_params: [{ constraints: [] }, { constraints: [] }],
    params: ["&signer", "address", "u64"],
  }),
});

export const buildVaultBalanceOfPayload = (args: {
  vaultAddress: string;
  userAddress: AccountAddressInput;
  token: string;
}): InputEntryFunctionData => ({
  function: `${args.vaultAddress}::perpetual_vault::balanceOf`,
  typeArguments: [
    `${args.token}::perpetual_vault_type::UserVault`,
    `${args.token}::perpetual_collateral::PerpetualCollateral`,
  ],
  functionArguments: [AccountAddress.from(args.userAddress)],
  abi: parseAbi({
    generic_type_params: [{ constraints: [] }, { constraints: [] }],
    params: ["&signer", "address"],
  }),
});
