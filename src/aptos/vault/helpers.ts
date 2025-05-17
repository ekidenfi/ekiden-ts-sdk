export const getWalletBalance = async (
  clientProvider: Provider,
  options: VaultOptions,
): Promise<VaultResource[]> => {
  return clientProvider.getAccountResources(options.wallet as string);
};
