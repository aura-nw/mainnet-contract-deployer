import CallApiMixin from "../../mixins/callApi/call-api.mixin";
import { Context, Service, ServiceBroker } from "moleculer";
import { Job } from "bull";
import { Config } from "../../common";
import { ContractDeploymentRequest, MainnetUploadStatus } from "../../types";
import { SmartContracts } from "../../entities";
import { dbSmartContractsMixin } from "../../mixins/dbMixins";
const QueueService = require('moleculer-bull');

export default class HandleRequestEuphoriaService extends Service {
    private callApiMixin = new CallApiMixin().start();
    private dbSmartContractsMixin = dbSmartContractsMixin;

    public constructor(public broker: ServiceBroker) {
        super(broker);
        this.parseServiceSchema({
            name: 'handleRequestEuphoria',
            version: 1,
            mixins: [
                QueueService(
                    `redis://${Config.REDIS_USERNAME}:${Config.REDIS_PASSWORD}@${Config.REDIS_HOST}:${Config.REDIS_PORT}/${Config.REDIS_DB_NUMBER}`,
                    {
                        prefix: 'handle.request-euphoria',
                    },
                ),
                // this.redisMixin,
                this.dbSmartContractsMixin,
                this.callApiMixin,
            ],
            queues: {
                'handle.request-euphoria': {
                    concurrency: parseInt(Config.CONCURRENCY_HANDLE_REQUEST, 10),
                    process(job: Job) {
                        job.progress(10);
                        // @ts-ignore
                        this.handleJob(job.data.code_id);
                        job.progress(100);
                        return true;
                    },
                }
            },
            actions: {
                updatestatus: {
                    name: 'updatestatus',
					rest: 'POST /deployment/request',
                    handler: (ctx: Context<ContractDeploymentRequest>) => {
                        this.logger.debug(`Update request status for contract with code ID ${ctx.params.code_id} on Euphoria`);
                        this.createJob(
                            'handle.request-euphoria',
                            {
                                code_id: ctx.params.code_id,
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

    async handleJob(code_id: number) {
        const result = await this.adapter.updateMany({ code_id }, { mainnet_upload_status: MainnetUploadStatus.PENDING });
        this.logger.info('Updated smart contracts:', result);
    }

    async _start() {
        this.getQueue('handle.request-euphoria').on('completed', (job: Job) => {
            this.logger.info(`Job #${job.id} completed!. Result:`, job.returnvalue);
        });
        this.getQueue('handle.request-euphoria').on('failed', (job: Job) => {
            this.logger.error(`Job #${job.id} failed!. Result:`, job.stacktrace);
        });
        this.getQueue('handle.request-euphoria').on('progress', (job: Job) => {
            this.logger.info(`Job #${job.id} progress is ${job.progress()}%`);
        });
        return super._start();
    }
}