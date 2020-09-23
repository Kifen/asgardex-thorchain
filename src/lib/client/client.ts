import { HttpRequest } from "../utils/request";
import {
  DECODED_ADDRESS_LEN,
  Network,
  decodeAddress,
  getPropValue,
  Transaction,
  TxParams,
  convertStringToBytes,
  sortObject,
  getPubKeyBase64,
} from "../utils";
import * as bech32 from "bech32";
import midgard from "@thorchain/asgardex-midgard";
import { BigSource } from "big.js";
import crypto from "crypto";
import secp256k1 from "secp256k1";

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
    privateKey: Buffer,
    mode: string
  ) {
    const chainId = await this.setChainId();
    const { sequence, accountNumber } = await this.getAccount(fromAddress);

    const msg = {
      msgs: [
        {
          type: "cosmos-sdk/MsgSend",
          value: {
            from_address: fromAddress,
            to_address: toAddress,
            amount: [{ denom: asset, amount: amount.toString() }],
          },
        },
      ],
      chain_id: chainId,
      memo: memo,
      fee: { amount: [{ denom: "", amount: "0" }], gas: "20000" },
      account_number: accountNumber,
      sequence,
    };

    let unsignedMsg = this.newMsg(msg);
    const signedTx = this.sign(unsignedMsg, privateKey);
    return await this.broadcastTx(signedTx);
  }

  newMsg(input) {
    const msg = new Object();
    msg["json"] = input;
    msg["bytes"] = convertStringToBytes(
      JSON.stringify(sortObject(msg["json"]))
    );

    return msg;
  }

  sign(unsignedMsg, priv, modeType = "sync") {
    let message = new Object();
    message = unsignedMsg.json;
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(sortObject(message)))
      .digest("hex");

    const buffer = Buffer.from(hash, "hex");
    let sig = secp256k1.ecdsaSign(buffer, priv);
    const sigBase64 = Buffer.from(sig.signature, "binary").toString("base64");

    console.log("SIG: ", getPubKeyBase64(priv));
    let signedTx = new Object();
    signedTx = {
      tx: {
        msg: unsignedMsg.json.msgs,
        fee: unsignedMsg.json.fee,
        signatures: [
          {
            account_number: unsignedMsg.json.account_number,
            sequence: unsignedMsg.json.sequence,
            signature: sigBase64,
            pub_key: {
              type: "tendermint/PubKeySecp256k1",
              value: getPubKeyBase64(priv),
            },
          },
        ],
        memo: unsignedMsg.json.memo,
      },
      mode: modeType,
    };

    return signedTx;
  }

  buildTransaction(
    msg,
    memo,
    fee,
    sequence,
    accountNumber,
    chainId,
    privateKey,
    mode
  ) {
    const params: TxParams = {
      account_number: accountNumber,
      chain_id: chainId,
      memo,
      msg,
      sequence,
      fee,
      mode,
    };

    const tx = new Transaction(params);
    return tx.sign(privateKey, msg);
  }

  async broadcastTx(signedTx: any) {
    const opts = {
      data: signedTx,
      headers: {
        "content-type": "text/plain",
      },
    };
    const res = await this._httpClient.request("post", "/txs", null, opts);

    return res;
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
