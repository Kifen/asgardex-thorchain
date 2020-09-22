import { HttpRequest } from "../utils/request";
import {
  DECODED_ADDRESS_LEN,
  Network,
  decodeAddress,
  getPropValue,
} from "../utils";
import * as bech32 from "bech32";

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
}
