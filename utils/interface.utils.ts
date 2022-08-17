import { Registry } from '@cosmjs/proto-signing';
import { GasPrice, StdFee } from '@cosmjs/stargate';
import { Log } from '@cosmjs/stargate/build/logs';

export interface Account {
  pubkey: Uint8Array;
  address: string;
}
export interface ExecuteContractResult {
  code: number;
  height?: number;
  transactionHash?: string;
  gasUsed?: number;
  gasWanted?: number;
  logs?: Log[];
  usedFee?: StdFee;
}

export interface SigningCosmWasmClientOptions {
  readonly registry?: Registry;
  readonly prefix?: string;
  readonly broadcastTimeoutMs?: number;
  readonly broadcastPollIntervalMs?: number;
  readonly gasPrice?: GasPrice;
}
