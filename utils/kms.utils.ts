import { makeSignBytes } from '@cosmjs/proto-signing';
import { toBase64 } from '@cosmjs/encoding';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { fromBase64 } from '@cosmjs/encoding';
import { sha256 } from '@cosmjs/crypto';
import * as axios from 'axios';
import { Secp256k1Signature } from '@cosmjs/crypto';
import { Account } from './interface.utils';
import { Config } from 'common';

export class KMSSigner {
  kmsSignApiUrl = '';
  kmsConnectApiUrl = '';
  constructor(alias: string) {
    const kmsApiUrl = `${Config.KMS_API_BASE_URL}/kms/${alias}`;
    this.kmsSignApiUrl = `${kmsApiUrl}/sign`;
    this.kmsConnectApiUrl = `${kmsApiUrl}/connect`;
  }

  async signWithKMS(signDoc: SignDoc): Promise<Secp256k1Signature> {
    const signBytes = makeSignBytes(signDoc);
    const hashedMessage = sha256(signBytes);

    const encodeMsg = toBase64(hashedMessage);

    const result = await axios.default.post(this.kmsSignApiUrl, {
      encodeMsg: encodeMsg,
    });
    const rsBase64 = result.data.Data;
    const rBuff = Buffer.from(rsBase64.r, 'base64');
    const sBuff = Buffer.from(rsBase64.s, 'base64');
    const signature = new Secp256k1Signature(rBuff, sBuff);
    return signature;
  }

  async getSystemAddress() {
    const result = await axios.default.post(this.kmsConnectApiUrl);
    return result.data.Data;
  }

  async getAccount(): Promise<Account> {
    const { encodePubkey, systemAddress } = await this.getSystemAddress();
    const pubkey = fromBase64(encodePubkey);
    const account: Account = {
      pubkey,
      address: systemAddress,
    };
    return account;
  }
}
