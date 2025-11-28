export * from "./core";
export { FundingClient } from "./modules/funding";
export { LeaderboardClient } from "./modules/leaderboard";
export { MarketClient } from "./modules/market";
export { OrderClient } from "./modules/order";
export { PositionClient } from "./modules/position";
export { UserClient } from "./modules/user";
export { VaultClient, VaultOnChain } from "./modules/vault";
export {
  decodeHexToString,
  parseSubAccountsData,
  SubAccountData,
} from "./modules/vault/VaultOnChain";
export * from "./streams";
export * from "./types";
export * from "./utils";

import { VaultOnChain } from "./modules/vault/VaultOnChain";

const vaultOnChainInstance = new VaultOnChain();

export const Vault = {
  requestWithdrawFromUser:
    vaultOnChainInstance.requestWithdrawFromUser.bind(vaultOnChainInstance),
  requestWithdrawFromUserSub:
    vaultOnChainInstance.requestWithdrawFromUserSub.bind(vaultOnChainInstance),
  depositIntoUser:
    vaultOnChainInstance.depositIntoUser.bind(vaultOnChainInstance),
  depositIntoFunding:
    vaultOnChainInstance.depositIntoFunding.bind(vaultOnChainInstance),
  depositIntoFundingWithTransferTo:
    vaultOnChainInstance.depositIntoFundingWithTransferTo.bind(
      vaultOnChainInstance,
    ),
  withdrawFromUserSub:
    vaultOnChainInstance.withdrawFromUserSub.bind(vaultOnChainInstance),
  withdrawFromFunding:
    vaultOnChainInstance.withdrawFromFunding.bind(vaultOnChainInstance),
  vaultBalance: vaultOnChainInstance.vaultBalance.bind(vaultOnChainInstance),
  ekidenVaultBalance:
    vaultOnChainInstance.ekidenVaultBalance.bind(vaultOnChainInstance),
  insuranceVaultBalance:
    vaultOnChainInstance.insuranceVaultBalance.bind(vaultOnChainInstance),
  ownedSubAccs: vaultOnChainInstance.ownedSubAccs.bind(vaultOnChainInstance),
  isEkidenUser: vaultOnChainInstance.isEkidenUser.bind(vaultOnChainInstance),
  isFundingVaultExists:
    vaultOnChainInstance.isFundingVaultExists.bind(vaultOnChainInstance),
  isTradingVaultExists:
    vaultOnChainInstance.isTradingVaultExists.bind(vaultOnChainInstance),
  transfer: vaultOnChainInstance.transfer.bind(vaultOnChainInstance),
  getSubAccs: vaultOnChainInstance.getSubAccs.bind(vaultOnChainInstance),
  createEkidenUser:
    vaultOnChainInstance.createEkidenUser.bind(vaultOnChainInstance),
  createAndLinkSubAccount:
    vaultOnChainInstance.createAndLinkSubAccount.bind(vaultOnChainInstance),
};
