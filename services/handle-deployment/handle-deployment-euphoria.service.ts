import CallApiMixin from "../../mixins/callApi/call-api.mixin";
import { Context, Service, ServiceBroker } from "moleculer";
import { Job } from "bull";
import { Config } from "../../common";
import { ContractStatus, DeploymentParams, DeploymentRequest, MainnetUploadStatus, UpdateContractStatusRequest } from "../../types";
import { dbSmartContractsMixin } from "../../mixins/dbMixins";
const QueueService = require('moleculer-bull');

export default class HandleDeploymentEuphoriaService extends Service {
    private callApiMixin = new CallApiMixin().start();
    private dbSmartContractsMixin = dbSmartContractsMixin;

    public constructor(public broker: ServiceBroker) {
        super(broker);
        this.parseServiceSchema({
            name: 'handleDeploymentEuphoria',
            version: 1,
            mixins: [
                QueueService(
                    `redis://${Config.REDIS_USERNAME}:${Config.REDIS_PASSWORD}@${Config.REDIS_HOST}:${Config.REDIS_PORT}/${Config.REDIS_DB_NUMBER}`,
                    {
                        prefix: 'handle.deployment-euphoria',
                    },
                ),
                // this.redisMixin,
                this.dbSmartContractsMixin,
                this.callApiMixin,
            ],
            queues: {
                'handle.deployment-euphoria': {
                    concurrency: parseInt(Config.CONCURRENCY_HANDLE_DEPLOYMENT, 10),
                    async process(job: Job) {
                        job.progress(10);
                        // @ts-ignore
                        await this.handleJob(job.data.euphoria_code_id, job.data.mainnet_code_id, job.data.creator_address);
                        job.progress(100);
                        return true;
                    },
                },
                'reject.deployment-euphoria': {
                    concurrency: parseInt(Config.CONCURRENCY_HANDLE_DEPLOYMENT, 10),
                    async process(job: Job) {
                        job.progress(10);
                        // @ts-ignore
                        await this.handleRejectionJob(job.data.code_ids, job.data.creator_address);
                        job.progress(100);
                        return true;
                    },
                }
            },
            actions: {
                executedeployment: {
                    name: 'executedeployment',
                    handler: (ctx: Context<UpdateContractStatusRequest>) => {
                        this.logger.debug(`Handle contract deployment request`);
                        this.createJob(
                            'handle.deployment-euphoria',
                            {
                                euphoria_code_id: ctx.params.euphoria_code_id,
                                mainnet_code_id: ctx.params.mainnet_code_id,
                                creator_address: ctx.params.creator_address,
                            },
                            {
                                removeOnComplete: true,
                            }
                        );
                    }
                },
                rejectdeployment: {
                    name: 'rejectdeployment',
                    handler: (ctx: Context<DeploymentParams>) => {
                        this.logger.debug(`Reject contract deployment request`);
                        this.createJob(
                            'reject.deployment-euphoria',
                            {
                                code_ids: ctx.params.code_ids,
                                creator_address: ctx.params.creator_address,
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

    async handleJob(euphoria_code_id: number, mainnet_code_id: number, creator_address: string) {
        this.logger.info("Handle contract deployment request " + euphoria_code_id + " " + mainnet_code_id);
        await this.adapter.updateMany({ code_id: euphoria_code_id, creator_address }, { reference_code_id: mainnet_code_id, mainnet_upload_status: ContractStatus.DEPLOYED });
    }

    async handleRejectionJob(code_ids: number[], creator_address: string) {
        await this.adapter.updateMany({ code_id: [...code_ids], creator_address }, { mainnet_upload_status: ContractStatus.REJECTED });
    }

    async _start() {
        this.getQueue('handle.deployment-euphoria').on('completed', (job: Job) => {
            this.logger.info(`Job #${job.id} completed!. Result:`, job.returnvalue);
        });
        this.getQueue('handle.deployment-euphoria').on('failed', (job: Job) => {
            this.logger.error(`Job #${job.id} failed!. Result:`, job.stacktrace);
        });
        this.getQueue('handle.deployment-euphoria').on('progress', (job: Job) => {
            this.logger.info(`Job #${job.id} progress is ${job.progress()}%`);
        });

        this.getQueue('reject.deployment-euphoria').on('completed', (job: Job) => {
            this.logger.info(`Job #${job.id} completed!. Result:`, job.returnvalue);
        });
        this.getQueue('reject.deployment-euphoria').on('failed', (job: Job) => {
            this.logger.error(`Job #${job.id} failed!. Result:`, job.stacktrace);
        });
        this.getQueue('reject.deployment-euphoria').on('progress', (job: Job) => {
            this.logger.info(`Job #${job.id} progress is ${job.progress()}%`);
        });

        return super._start();
    }
}