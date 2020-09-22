import { HttpRequest } from "../utils/request";
import {
  DECODED_ADDRESS_LEN,
  Network,
  decodeAddress,
  getPropValue,
} from "../utils";
import * as bech32 from "bech32";
import midgard from "@thorchain/asgardex-midgard";
import { BigSource } from "big.js";

export const NETWORK_PREFIX_MAPPING = {
  testnet: "tthor",
  chaosnet: "thor",
} as const;

export class ThorClient {
  public _httpClient: HttpRequest;
  public addressPrefix: typeof NETWORK_PREFIX_MAPPING[keyof typeof NETWORK_PREFIX_MAPPING];
  public network: Network;
  public chainId: string;
  public accountNumber: string;
  public sequence: string; // storing sequence numbers to not send two transactions with the same sequence number

  constructor(server: string, network: Network) {
    if (!server) {
      throw new Error("Thorchain server should not be null");
    }
    this.addressPrefix = NETWORK_PREFIX_MAPPING[network];
    this._httpClient = new HttpRequest(server);
  }

  getThorChainBaseUrl = async (): Promise<string> => {
    return await midgard(this.network, true);
  };

  checkAddress = (address: string, prefix: string): boolean => {
    try {
      if (!address.startsWith(prefix)) {
        return false;
      }

      const decodedAddress = bech32.decode(address);
      const decodedAddressLength = decodeAddress(address).length;
      if (
        decodedAddressLength === DECODED_ADDRESS_LEN &&
        decodedAddress.prefix === prefix
      ) {
        return true;
      }

      return false;
    } catch (err) {
      return false;
    }
  };

  async getBalance(address: string) {
    try {
      const data = await this.accountInfo(address);
      return getPropValue(data.result, "value.coins");
    } catch (e) {
      return [];
    }
  }

  async accountInfo(address: string) {
    try {
      const res: any = await this._httpClient.request(
        "get",
        `/auth/accounts/${address}`
      );

      if (res.result.height !== undefined && res.result.result !== undefined) {
        return res.result;
      }

      return [];
    } catch (err) {
      return [];
    }
  }

  async transfer(
    fromAddress: string,
    toAddress: string,
    asset: string,
    amount: BigSource,
    memo: string,
    privateKey: Buffer
  ) {
    const chainId = await this.setChainId();
    const { sequence, accountNumber } = await this.getAccount(fromAddress);
  }

  async getBlock(blockHeight: string) {
    try {
      const res: any = await this._httpClient.request(
        "get",
        `/blocks/${blockHeight}`
      );
      return res.result;
    } catch (err) {
      throw new Error(`Failed to get block: ${err}`);
    }
  }

  async setChainId(chainId = this.chainId) {
    if (!chainId) {
      const data = await this.getBlock("latest");
      chainId = getPropValue(data, "block.header.chain_id");
    }
    this.chainId = chainId;
    return chainId;
  }

  async getAccount(address: string) {
    const data = await this.accountInfo(address);
    const sequence = getPropValue(data, "result.value.sequence");
    const accountNumber = getPropValue(data, "result.value.account_number");
    this.sequence =
      this.sequence && sequence < this.sequence ? this.sequence : sequence;
    this.accountNumber = accountNumber;

    return { sequence: this.sequence, accountNumber: this.accountNumber };
  }
}
