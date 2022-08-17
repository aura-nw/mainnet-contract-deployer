import { CosmWasmClient, InstantiateOptions, InstantiateResult, MsgInstantiateContractEncodeObject, MsgStoreCodeEncodeObject, UploadResult } from "@cosmjs/cosmwasm-stargate";
import { fromBase64, toUtf8, toHex } from '@cosmjs/encoding';
import {
    EncodeObject,
    Registry,
    GeneratedType,
    encodePubkey,
    TxBodyEncodeObject,
    makeAuthInfoBytes,
    makeSignDoc
} from "@cosmjs/proto-signing";
import {
    MsgClearAdmin,
    MsgExecuteContract,
    MsgInstantiateContract,
    MsgMigrateContract,
    MsgStoreCode,
    MsgUpdateAdmin,
} from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import {
    StdFee,
    DeliverTxResponse,
    defaultRegistryTypes as defaultStargateTypes,
    calculateFee,
    SignerData,
    isDeliverTxFailure,
    logs
} from "@cosmjs/stargate";
import { Int53, Uint53 } from '@cosmjs/math';
import { encodeSecp256k1Pubkey, encodeSecp256k1Signature } from '@cosmjs/amino';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { assertDefined } from '@cosmjs/utils';
import { Account, SigningCosmWasmClientOptions } from "./interface.utils";
import { KMSSigner } from "./kms.utils";
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { Logger } from "mongodb";
import { AppConstants, ErrorMessage } from "types";
import { gzip } from "pako";
import { fromString } from 'long';
import { sha256 } from '@cosmjs/crypto';

const wasmTypes: ReadonlyArray<[string, GeneratedType]> = [
    ['/cosmwasm.wasm.v1.MsgClearAdmin', MsgClearAdmin],
    ['/cosmwasm.wasm.v1.MsgExecuteContract', MsgExecuteContract],
    ['/cosmwasm.wasm.v1.MsgMigrateContract', MsgMigrateContract],
    ['/cosmwasm.wasm.v1.MsgStoreCode', MsgStoreCode],
    ['/cosmwasm.wasm.v1.MsgInstantiateContract', MsgInstantiateContract],
    ['/cosmwasm.wasm.v1.MsgUpdateAdmin', MsgUpdateAdmin],
];

function createDefaultRegistry(): Registry {
    return new Registry([...defaultStargateTypes, ...wasmTypes]);
}

function createDeliverTxResponseErrorMessage(
    result: DeliverTxResponse,
): string {
    return `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`;
}

export class Network extends CosmWasmClient {
    private gasPrice?: any;
    public readonly registry: Registry;
    private readonly _logger = new Logger(Network.name);

    public static async connectWithSigner(
        rpcEndpoint: string,
        account: Account,
        signer: KMSSigner,
        options: SigningCosmWasmClientOptions = {},
    ) {
        const tmClient = await Tendermint34Client.connect(rpcEndpoint);
        return new Network(tmClient, account, signer, options);
    }

    protected constructor(
        tmClient: Tendermint34Client | undefined,
        public account: Account,
        public signer: KMSSigner,
        options: SigningCosmWasmClientOptions,
    ) {
        super(tmClient);
        this.gasPrice = options.gasPrice;
        this.registry = createDefaultRegistry();
    }

    public async simulate(
        signerAddress: string,
        messages: readonly EncodeObject[],
        memo: string | undefined,
        account: Account,
    ): Promise<number | any> {
        const anyMsgs = messages.map((m) => this.registry.encodeAsAny(m));
        const accountFromSigner = account;
        const pubkey = encodeSecp256k1Pubkey(accountFromSigner.pubkey);
        const { sequence } = await this.getSequence(signerAddress);
        try {
            const { gasInfo } = await this.forceGetQueryClient().tx.simulate(
                anyMsgs,
                memo,
                pubkey,
                sequence,
            );
            assertDefined(gasInfo);
            return Uint53.fromString(gasInfo.gasUsed.toString()).toNumber();
        } catch (error: any) {
            this.handleError(error);
        }
    }

    handleError(error: Error) {
        this._logger.error(error.message);
        if (error.message.search(AppConstants.INSUFFICIENT_FUNDS) > -1)
            throw new Error(ErrorMessage.INSUFFICIENT_FUNDS);
        throw new Error(ErrorMessage.SIMULATE_TX_FAIL);
    }

    async instantiateSmartcontract(
        senderAddress: string,
        codeId: number,
        msg: Record<string, unknown>,
        label: string,
        fee: StdFee | 'auto' | number,
        options: InstantiateOptions = {},
    ): Promise<InstantiateResult> {
        const instantiateContractMsg: MsgInstantiateContractEncodeObject = {
            typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
            value: MsgInstantiateContract.fromPartial({
                sender: senderAddress,
                codeId: fromString(new Uint53(codeId).toString()),
                label: label,
                msg: toUtf8(JSON.stringify(msg)),
                funds: [...(options.funds || [])],
                admin: options.admin,
            }),
        };
        const [result] = await this.signAndBroadcast(
            senderAddress,
            [instantiateContractMsg],
            fee,
            options.memo,
        );
        if (isDeliverTxFailure(result)) {
            throw new Error(createDeliverTxResponseErrorMessage(result));
        }
        const parsedLogs = logs.parseRawLog(result.rawLog);
        const contractAddressAttr = logs.findAttribute(
            parsedLogs,
            'instantiate',
            '_contract_address',
        );
        return {
            contractAddress: contractAddressAttr.value,
            logs: parsedLogs,
            height: result.height,
            transactionHash: result.transactionHash,
            gasWanted: result.gasWanted,
            gasUsed: result.gasUsed,
        };
    }

    /** Uploads code and returns a receipt, including the code ID */
    public async upload(
        senderAddress: string,
        wasmCode: Uint8Array,
        fee: StdFee | 'auto' | number,
        memo = '',
    ): Promise<UploadResult> {
        const compressed = gzip(wasmCode, { level: 9 });
        const storeCodeMsg: MsgStoreCodeEncodeObject = {
            typeUrl: '/cosmwasm.wasm.v1.MsgStoreCode',
            value: MsgStoreCode.fromPartial({
                sender: senderAddress,
                wasmByteCode: compressed,
            }),
        };

        const [result] = await this.signAndBroadcast(
            senderAddress,
            [storeCodeMsg],
            fee,
            memo,
        );
        if (isDeliverTxFailure(result)) {
            throw new Error(createDeliverTxResponseErrorMessage(result));
        }
        const parsedLogs = logs.parseRawLog(result.rawLog);
        const codeIdAttr = logs.findAttribute(parsedLogs, 'store_code', 'code_id');
        return {
            originalSize: wasmCode.length,
            originalChecksum: toHex(sha256(wasmCode)),
            compressedSize: compressed.length,
            compressedChecksum: toHex(sha256(compressed)),
            codeId: Number.parseInt(codeIdAttr.value, 10),
            logs: parsedLogs,
            height: result.height,
            transactionHash: result.transactionHash,
            gasWanted: result.gasWanted,
            gasUsed: result.gasUsed,
        };
    }

    /**
     * Creates a transaction with the given messages, fee and memo. Then signs and broadcasts the transaction.
     *
     * @param signerAddress The address that will sign transactions using this instance. The signer must be able to sign with this address.
     * @param messages
     * @param fee
     * @param memo
     */
    public async signAndBroadcast(
        signerAddress: string,
        messages: readonly EncodeObject[],
        fee: StdFee | 'auto' | number,
        memo = '',
    ): Promise<[DeliverTxResponse, StdFee]> {
        let usedFee: StdFee;
        if (fee == 'auto' || typeof fee === 'number') {
            usedFee = await this.getUsedFee(signerAddress, messages, fee, memo);
        } else {
            usedFee = fee;
        }
        // TODO: check balance
        const txRaw = await this.sign(signerAddress, messages, usedFee, memo);
        const txBytes = TxRaw.encode(txRaw).finish();
        const result = await this.broadcastTx(txBytes, undefined, undefined);
        return [result, usedFee];
    }

    async getUsedFee(
        signerAddress: string,
        messages: readonly EncodeObject[],
        fee: StdFee | 'auto' | number,
        memo = '',
    ) {
        assertDefined(
            this.gasPrice,
            'Gas price must be set in the client options when auto gas is used.',
        );
        const gasEstimation = await this.simulate(
            signerAddress,
            messages,
            memo,
            this.account,
        );
        const multiplier = typeof fee === 'number' ? fee : 1.3;
        return calculateFee(Math.round(gasEstimation * multiplier), this.gasPrice);
    }

    async sign(
        signerAddress: string,
        messages: readonly EncodeObject[],
        fee: StdFee,
        memo: string,
    ) {
        const { accountNumber, sequence } = await this.getSequence(signerAddress);
        const chainId = await this.getChainId();
        const signerData: SignerData = {
            accountNumber: accountNumber,
            sequence: sequence,
            chainId: chainId,
        };

        return this.signDirect(messages, fee, memo, signerData);
    }

    async signDirect(
        messages: readonly EncodeObject[],
        fee: StdFee,
        memo: string,
        { accountNumber, sequence, chainId }: SignerData,
    ) {
        const accountFromSigner = {
            pubkey: this.account.pubkey,
            address: this.account.address,
        };
        const pubkey = encodePubkey(
            encodeSecp256k1Pubkey(accountFromSigner.pubkey),
        );
        const txBody: TxBodyEncodeObject = {
            typeUrl: '/cosmos.tx.v1beta1.TxBody',
            value: {
                messages: messages,
                memo: memo,
            },
        };

        // create registry
        const wasmTypes: ReadonlyArray<[string, GeneratedType]> = [
            ['/cosmwasm.wasm.v1.MsgClearAdmin', MsgClearAdmin],
            ['/cosmwasm.wasm.v1.MsgExecuteContract', MsgExecuteContract],
            ['/cosmwasm.wasm.v1.MsgMigrateContract', MsgMigrateContract],
            ['/cosmwasm.wasm.v1.MsgStoreCode', MsgStoreCode],
            ['/cosmwasm.wasm.v1.MsgInstantiateContract', MsgInstantiateContract],
            ['/cosmwasm.wasm.v1.MsgUpdateAdmin', MsgUpdateAdmin],
        ];
        const registry: Registry = new Registry([
            ...defaultStargateTypes,
            ...wasmTypes,
        ]);
        const txBodyBytes = registry.encode(txBody);
        const gasLimit = Int53.fromString(fee.gas).toNumber();
        const authInfoBytes = makeAuthInfoBytes(
            [{ pubkey, sequence }],
            fee.amount,
            gasLimit,
        );
        const signDoc = makeSignDoc(
            txBodyBytes,
            authInfoBytes,
            chainId,
            accountNumber,
        );

        const signature = await this.signer.signWithKMS(signDoc);
        const signatureBytes = new Uint8Array([
            ...signature.r(32),
            ...signature.s(32),
        ]);
        const stdSignature = encodeSecp256k1Signature(
            accountFromSigner.pubkey,
            signatureBytes,
        );

        const signed = signDoc;
        return TxRaw.fromPartial({
            bodyBytes: signed.bodyBytes,
            authInfoBytes: signed.authInfoBytes,
            signatures: [fromBase64(stdSignature.signature)],
        });
    }
}