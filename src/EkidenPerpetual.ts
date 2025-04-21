import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { AccountInfo, WalletCore } from "@aptos-labs/wallet-adapter-core";
import { AptosClient } from "aptos";
import {
  MoveResource,
  OptionsEkiden,
  OptionsReadEvent,
  OptionsWriteEvent,
} from "src/interface";
import { ReadActions } from "src/ReadActions";
import { WriteActions } from "src/WriteActions";

const clientUrl = "https://fullnode.testnet.aptoslabs.com"; // вынести в конфиг

export const walletCore = new WalletCore(
  undefined,
  { network: Network.TESTNET },
  true,
);

export class EkidenPerpetual {
  private options: OptionsEkiden;
  private provider: Aptos;

  constructor(params: OptionsEkiden = {}) {
    this.options = {};

    const config = new AptosConfig({ network: Network.TESTNET });

    if (params.wallet) {
      this.options.wallet = params.wallet;
    }

    this.provider = new Aptos(config);
  }

  private getOptionsWrite(): OptionsWriteEvent {
    if (!this.options.wallet || !this.provider) {
      throw new Error("Wallet or provider not defined");
    }
    return { options: this.options, provider: this.provider };
  }

  private getOptionsRead(): OptionsReadEvent {
    const clientProvider = new AptosClient(clientUrl);
    if (!this.options.wallet || !this.provider || !clientProvider) {
      throw new Error("Wallet or provider or clientProvider not defined");
    }
    return {
      options: this.options,
      provider: this.provider,
      clientProvider: clientProvider,
    };
  }

  setActiveWallet(wallet?: string): void {
    this.options.wallet = wallet;
  }

  connect(wallet: string) {
    this.options.wallet = wallet;
  }

  private getRead(): ReadActions {
    const { options, provider, clientProvider } = this.getOptionsRead();
    return new ReadActions(options, provider, clientProvider);
  }

  private getWrite(): WriteActions {
    const { options, provider } = this.getOptionsWrite();
    return new WriteActions(options, provider);
  }

  get account(): AccountInfo | null {
    return walletCore.account ?? null;
  }

  get isConnected(): boolean {
    return walletCore.isConnected();
  }

  async deposit(token: string, amount: string) {
    if (this.account) {
      return this.getWrite().deposit(token, amount);
    }
  }

  async withdraw(token: string, amount: string) {
    if (this.account) {
      return this.getWrite().withdraw(token, amount);
    }
  }

  async getContactBalance(): Promise<string[]> {
    return this.getRead().getContractBalance();
  }

  async getWalletBalance(): Promise<MoveResource[]> {
    return this.getRead().getWalletBalance();
  }
}
