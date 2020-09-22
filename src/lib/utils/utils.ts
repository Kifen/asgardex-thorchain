import * as bip39 from "bip39";
import { BIP32Interface, fromSeed } from "bip32";
import { ec } from "elliptic";
import { PRIVKEY_LEN, CURVE } from "../utils";
import * as bech32 from "bech32";
import { SHA256 } from "crypto-js";
import * as Hex from "crypto-js/enc-hex";
import { RIPEMD160 } from "crypto-js";

export const getPrivateKey = (mnemonic: string, hdPath: string): Buffer => {
  const masterKey = deriveMasterKey(mnemonic);
  const cosmosHd = masterKey.derivePath(hdPath);

  if (!cosmosHd.privateKey) {
    throw new Error("cosmosHD does not have a private key");
  }
  const privateKey = cosmosHd.privateKey;
  return privateKey;
};

export const deriveMasterKey = (mnemonic: string): BIP32Interface => {
  if (
    !bip39.validateMnemonic(mnemonic, bip39.wordlists.english) &&
    !bip39.validateMnemonic(mnemonic, bip39.wordlists.chinese_simplified) &&
    !bip39.validateMnemonic(mnemonic, bip39.wordlists.chinese_traditional) &&
    !bip39.validateMnemonic(mnemonic, bip39.wordlists.korean) &&
    !bip39.validateMnemonic(mnemonic, bip39.wordlists.french) &&
    !bip39.validateMnemonic(mnemonic, bip39.wordlists.italian) &&
    !bip39.validateMnemonic(mnemonic, bip39.wordlists.spanish) &&
    !bip39.validateMnemonic(mnemonic, bip39.wordlists.japanese)
  ) {
    throw new Error("Invalid mnemonic");
  }

  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const masterKey = fromSeed(seed);

  return masterKey;
};

export const getAddress = (privateKey: string, prefix: string): string => {
  const publicKey = derivePublicKeyFromPrivateKey(privateKey);
  const address = deriveAddressFromPublicKey(publicKey, prefix);
  return address;
};

export const derivePublicKeyFromPrivateKey = (
  privateKeyHex: string
): string => {
  if (!privateKeyHex || privateKeyHex.length !== PRIVKEY_LEN * 2) {
    throw new Error("invalid privateKey");
  }

  const curve = new ec(CURVE);
  const keyPair = curve.keyFromPrivate(privateKeyHex, "hex");
  return keyPair.getPublic().encode("hex", false);
};

export const deriveAddressFromPublicKey = (
  publicKeyHex: string,
  prefix: string
) => {
  const EC = new ec(CURVE);
  const key = EC.keyFromPublic(publicKeyHex, "hex");
  const pubpoint = key.getPublic();
  const compressed = pubpoint.encodeCompressed();
  const hexd = ab2hexstring(compressed);
  const hash = sha256ripemd160(hexd);
  const address = encodeAddress(hash, prefix);
  return address;
};

const ab2hexstring = (arr: any) => {
  if (typeof arr !== "object") {
    throw new Error("ab2hexstring expects an array");
  }
  let result = "";
  for (let i = 0; i < arr.length; i++) {
    let str = arr[i].toString(16);
    str = str.length === 0 ? "00" : str.length === 1 ? "0" + str : str;
    result += str;
  }
  return result;
};

const sha256ripemd160 = (hex: string) => {
  if (typeof hex !== "string")
    throw new Error("sha256ripemd160 expects a string");
  if (hex.length % 2 !== 0)
    throw new Error(`invalid hex string length: ${hex}`);
  const hexEncoded = Hex.parse(hex);
  const ProgramSha256: any = SHA256(hexEncoded);
  return RIPEMD160(ProgramSha256).toString();
};

export const encodeAddress = (
  value: string | Buffer,
  prefix: string,
  type: BufferEncoding = "hex"
): string => {
  let words;
  if (Buffer.isBuffer(value)) {
    words = bech32.toWords(Buffer.from(value));
  } else {
    words = bech32.toWords(Buffer.from(value, type));
  }
  return bech32.encode(prefix, words);
};

export const decodeAddress = (value: string): Buffer => {
  const decodeAddress = bech32.decode(value);
  return Buffer.from(bech32.fromWords(decodeAddress.words));
};

export const getPropValue = (obj, key) =>
  key.split(".").reduce((o, x) => (o == undefined ? o : o[x]), obj);
