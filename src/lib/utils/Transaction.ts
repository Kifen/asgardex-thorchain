import SHA256 from "crypto-js/sha256";
import crypto from "crypto";
import secp256k1 from "secp256k1";
import { getPubKeyBase64, sortObject } from "../utils";

export type TxParams = {
  account_number: string;
  chain_id: string;
  fee: string;
  msg: any;
  memo: string;
  sequence: string;
  mode: string;
};

export class Transaction {
  public accountNumber: string;
  public chainId: string;
  public fee: string;
  public msgs: any;
  public memo: string;
  public mode: string;
  public sequence: string;

  constructor(params: TxParams) {
    this.accountNumber = params.account_number;
    this.chainId = params.chain_id;
    this.fee = params.fee;
    this.memo = params.memo;
    this.sequence = params.sequence;
    this.msgs = params.msg;
    this.mode = params.mode;
  }

  sign(privateKey: Buffer, msg: any) {
    const signMsg = {
      account_number: this.accountNumber.toString(),
      chain_id: this.chainId,
      fee: this.fee,
      memo: this.memo,
      msgs: msg,
      sequence: this.sequence,
    };

    const jsonMsg = JSON.stringify(signMsg);
    const signBytes = Buffer.from(jsonMsg, "hex");
    //const signature = this.signature(signBytes.toString("hex"), privateKey);
    const signature = this.signature(signBytes, privateKey);
    return signature;
  }

  signature(msgHex: any, privateKey: Buffer) {
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(sortObject(msgHex)))
      .digest("hex");
    const buffer = Buffer.from(hash, "hex");
    const signature = secp256k1.ecdsaSign(buffer, privateKey);
    const sigBase64 = Buffer.from(signature.signature, "binary").toString(
      "base64"
    );

    const serializedTx = this.serializeTx(
      sigBase64,
      getPubKeyBase64(privateKey),
      this.mode
    );

    return serializedTx;
  }

  serializeTx(signature, pubKeyBase64, mode) {
    const stdTx = {
      tx: {
        msg: this.msgs,
        fee: this.fee,
        memo: this.memo,
        signatures: [
          {
            account_number: this.accountNumber,
            sequence: this.sequence,
            signature: signature,
            pub_key: {
              type: "tendermint/PubKeySecp256k1",
              value: pubKeyBase64,
            },
          },
        ],
      },
      mode,
    };

    return JSON.stringify(stdTx);
  }
}
