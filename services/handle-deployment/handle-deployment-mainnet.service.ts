import CallApiMixin from "../../mixins/callApi/call-api.mixin";
import { Context, Service, ServiceBroker } from "moleculer";
import { gzip } from 'pako';
import { Job } from "bull";
import { Config } from "../../common";
import { AppConstants, HandleDeploymentRequest } from "../../types";
import { SmartContracts } from "../../entities";
import { dbSmartContractsMixin } from "../../mixins/dbMixins";
import { KMSSigner } from "../../utils/kms.utils";
import { GasPrice, StdFee } from '@cosmjs/stargate';
import { Network } from "../../utils/network.utils";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
const QueueService = require('moleculer-bull');

export default class HandleDeploymentMainnetService extends Service {
    private callApiMixin = new CallApiMixin().start();
    private dbSmartContractsMixin = dbSmartContractsMixin;
    private network: Network = {} as Network;
    private defaultGasPrice = GasPrice.fromString(AppConstants.DEFAULT_GAS_PRICE);

    public constructor(public broker: ServiceBroker) {
        super(broker);
        this.parseServiceSchema({
            name: 'handleDeploymentMainnet',
            version: 1,
            mixins: [
                QueueService(
                    `redis://${Config.REDIS_USERNAME}:${Config.REDIS_PASSWORD}@${Config.REDIS_HOST}:${Config.REDIS_PORT}/${Config.REDIS_DB_NUMBER}`,
                    {
                        prefix: 'handle.deployment-mainnet',
                    },
                ),
                // this.redisMixin,
                this.dbSmartContractsMixin,
                this.callApiMixin,
            ],
            queues: {
                'handle.deployment-mainnet': {
                    concurrency: parseInt(Config.CONCURRENCY_HANDLE_DEPLOYMENT, 10),
                    async process(job: Job): Promise<SmartContracts> {
                        job.progress(10);
                        // @ts-ignore
                        const result = await this.handleJob(job.data.smart_contract);
                        job.progress(100);
                        return result;
                    },
                }
            },
            actions: {
                executedeployment: {
                    name: 'executedeployment',
                    handler: (ctx: Context<HandleDeploymentRequest>) => {
                        this.logger.debug(`Deploy contract on mainnet`);
                        this.createJob(
                            'handle.deployment-mainnet',
                            {
                                smart_contract: ctx.params.smart_contract,
                            },
                            {
                                removeOnComplete: true,
                            }
                        );
                    }
                }
            }
        })
    }

    async handleJob(smart_contract: SmartContracts) {
        // const client = await CosmWasmClient.connect(Config.EUPHORIA_RPC);
        const client = await CosmWasmClient.connect(Config.DEV_RPC);
        const codeDetails = await client.getCodeDetails(smart_contract.code_id!);
        this.logger.info('Code details:', codeDetails);

        // Get signer
        const signer = new KMSSigner(Config.SIGNER_WALLET_ADDRESS);

        // Get system address info
        const account = await signer.getAccount();
        this.logger.info('System account:', account);

        // Connect network
        this.network = await Network.connectWithSigner(
            // Config.MAINNET_RPC,
            Config.DEV_RPC,
            account,
            signer,
            { gasPrice: this.defaultGasPrice }
        );

        const codeId = await this.storeCode(account.address, codeDetails.data, AppConstants.AUTO);
        this.logger.info('Code id:', codeId);
        
        /// Send code id through email to user???

        return codeId.toString();
    }

    async storeCode(senderAddress: string, wasmCode: Uint8Array, fee: StdFee | 'auto' | number) {
        const result = await this.network.upload(senderAddress, wasmCode, fee);
        if (!result.codeId) {
            this.logger.error(result);
            return '';
        }
        return result.codeId;
    }

    async _start() {
        this.getQueue('handle.deployment-mainnet').on('completed', (job: Job) => {
            this.logger.info(`Job #${job.id} completed!. Result:`, job.returnvalue);
        });
        this.getQueue('handle.deployment-mainnet').on('failed', (job: Job) => {
            this.logger.error(`Job #${job.id} failed!. Result:`, job.stacktrace);
        });
        this.getQueue('handle.deployment-mainnet').on('progress', (job: Job) => {
            this.logger.info(`Job #${job.id} progress is ${job.progress()}%`);
        });
        return super._start();
    }
}