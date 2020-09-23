import { BigSource } from "big.js";

export type Network = "testnet" | "chaosnet";
//export type Prefix = "thor" | "tthor"
export type Address = string;
export type Prefix = string;

export interface Balance {
  denom: string;
  amount: BigSource;
}
export type Balances = Balance[];
export interface Coin {
  denom: string;
  amount: BigSource;
}

/**
 * A private and public key pair.
 */
export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export type Txs = Tx[];

export interface Wallet extends KeyPair {
  address: string;
}

export type TxSide = "RECEIVE" | "SEND";

export type TxPage = {
  /**
   * total sum of transactions
   */
  count: number;
  /**
   * List of transactions
   */
  tx: Txs;
};

export type Tx = {
  date: number;
  events: Events;
  height: string;
  in: Data;
  out: Data;
  pool: string;
  status: string;
  type: TxType;
};

export type TxType =
  | "swap"
  | "stake"
  | "unstake"
  | "add"
  | "refund"
  | "FREEZE_TOKEN"
  | "doubleswap";

export type Data = {
  address: string;
  memo: string;
  txID: string;
  coins: Coins[];
};

export type Coins = {
  amount: string;
  asset: string;
};

export type Events = {
  fee: string;
  slip: string;
  stakeUnits: string;
};

export type GetTxsParams = {
  address?: string;
  txid?: string;
  asset?: string;
  type?: TxType;
  offset?: number;
  limit?: number;
};

export type VaultTxParams = {
  addressFrom?: Address;
  addressTo: Address;
  amount: BigSource;
  asset: string;
  memo?: string;
  mode?: string;
};

export type TransferResult = { result?: Transfers };

export type Transfers = Transfer[];

export type Transfer = {
  code: number;
  hash: string;
  log: string;
  ok: boolean;
};
