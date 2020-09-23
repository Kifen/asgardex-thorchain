import {
  Address,
  HDPATH,
  NETWORK_PREFIX,
  Balances,
  TxPage,
  GetTxsParams,
  VaultTxParams,
  TransferResult,
  Prefix,
  Network,
  getPrivateKey,
  getAddress,
} from "../lib/utils";
import * as BIP39 from "bip39";
import { ThorClient } from "../lib/client/client";
import axios from "axios";

export interface thorchainClient {
  getThorClient(): ThorClient;
  getBalance(address?: Address): Promise<Balances>;
  setNetwork(net: Network): thorchainClient;
  setPhrase(phrase: string): thorchainClient;
  getNetwork(): Network;
  getClientUrl(): string;
  getPrefix(): Prefix;
  getAddress(): string | undefined;
  validateAddress(address: string): boolean;
  getExplorerUrl(): string;
  getTransactions(params?: GetTxsParams): Promise<TxPage>;
  //vaultTx(params: VaultTxParams): Promise<TransferResult>;
}

export class Client implements thorchainClient {
  private network: Network;
  private prefix: Prefix;
  private chainUrl: string;
  private chainId: string;
  private hdPath: string;
  private thorClient: ThorClient;
  private phrase: string | null = null;
  private address: string | null = null;
  private privateKey: Buffer | null = null;

  constructor({
    network = "testnet",
    prefix,
    phrase,
    hdpath = HDPATH,
    chainId,
    chainUrl,
  }: {
    network: Network;
    prefix: Prefix;
    phrase?: string;
    hdpath?: string;
    chainId?: string;
    chainUrl?: string;
  }) {
    if (phrase) this.setPhrase(phrase);
    if (network) this.setNetwork(network);

    this.chainUrl = chainUrl;
    this.chainId = chainId;
    this.hdPath = hdpath;
    this.prefix = prefix;

    this.thorClient = new ThorClient(this.getClientUrl(), this.network);
  }

  setPhrase = (phrase: string): thorchainClient => {
    if (this.phrase && this.phrase === phrase) return this;
    if (!Client.validatePhrase(phrase)) {
      throw Error("Invalid BIP39 phrase passed to ThorChain Client");
    }
    this.phrase = phrase;
    this.address = null;
    this.privateKey = null;
    return this;
  };

  setNetwork = (network: string): thorchainClient => {
    if (!NETWORK_PREFIX[network]) {
      throw new Error(
        "Invalid network. Network must be either Testnet or Chaosnet"
      );
    }

    this.network = NETWORK_PREFIX[network];
    return this;
  };

  getClientUrl = (): string => {
    return this.chainUrl;
  };

  static validatePhrase = (phrase: string): boolean => {
    return BIP39.validateMnemonic(phrase);
  };

  private getPrivateKey = () => {
    if (!this.privateKey) {
      if (!this.phrase) throw Error("Phrase has not been set");
      const privateKey = getPrivateKey(this.phrase, this.hdPath);
      this.privateKey = privateKey;
      return privateKey;
    }

    return this.privateKey;
  };

  getThorClient(): ThorClient {
    return this.thorClient;
  }

  getPrefix = (): string => {
    return this.prefix;
  };

  getNetwork = (): Network => {
    return this.network;
  };

  getBaseUrl = async (): Promise<string> => {
    //await this.thorClient.getThorChainBaseUrl();
    return this.network === "testnet"
      ? "http://175.41.137.209:8080"
      : "http://18.159.173.48:8080";
  };

  getAddress = (): string | undefined => {
    if (this.address) return this.address;
    let privateKey;
    try {
      privateKey = this.getPrivateKey();
    } catch (err) {
      return undefined;
    }

    const address = getAddress(privateKey.toString("hex"), this.getPrefix());
    this.address = address;
    return address;
  };

  validateAddress = (address: string): boolean => {
    return this.thorClient.checkAddress(address, this.prefix);
  };

  getBalance = async (address: Address): Promise<Balances> => {
    return await this.thorClient.getBalance(address);
  };

  getExplorerUrl = (): string => {
    return "https://viewblock.io/thorchain";
  };

  getTransactions = async (params: GetTxsParams): Promise<TxPage> => {
    if (!(params.offset && params.limit)) {
      params.offset = 1;
      params.limit = 1;
    }
    const { address, txid, limit, offset, type } = params;

    const url = new URL(`${this.getBaseUrl()}/v1/txs`);

    if (address) url.searchParams.set("address", address);
    if (txid) url.searchParams.set("txid", txid);
    if (limit) url.searchParams.set("limit", limit.toString());
    if (offset) url.searchParams.set("offset", offset.toString());
    if (offset) url.searchParams.set("side", offset.toString());
    if (type) url.searchParams.set("startTime", type.toString());

    try {
      const res = await axios.get<TxPage>(url.toString());
      return res.data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  vaultTx = async (params: VaultTxParams): Promise<TransferResult> => {
    const { addressFrom, addressTo, amount, asset, memo, mode } = params;
    const pk = this.getPrivateKey();
    const res = await this.thorClient.transfer(
      addressFrom,
      addressTo,
      asset,
      amount,
      memo,
      pk,
      mode
    );

    return res.result;
  };
}
