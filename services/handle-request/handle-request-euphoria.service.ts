import CallApiMixin from "../../mixins/callApi/call-api.mixin";
import { Context, Service, ServiceBroker } from "moleculer";
import { Job } from "bull";
import { Config } from "../../common";
import { ContractDeploymentRequest, ContractStatus, MainnetUploadStatus } from "../../types";
import { SmartContracts } from "../../entities";
import { dbSmartContractsMixin } from "../../mixins/dbMixins";
const QueueService = require('moleculer-bull');
import QueueConfig from '../../common/queue';

export default class HandleRequestEuphoriaService extends Service {
    private callApiMixin = new CallApiMixin().start();
    private dbSmartContractsMixin = dbSmartContractsMixin;

    public constructor(public broker: ServiceBroker) {
        super(broker);
        this.parseServiceSchema({
            name: 'handleRequestEuphoria',
            version: 1,
            mixins: [
                QueueService(QueueConfig.redis, QueueConfig.opts),
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
                        this.handleJob(job.data.code_id, job.data.creator_address);
                        job.progress(100);
                        return true;
                    },
                }
            },
            actions: {
                updatestatus: {
                    name: 'updatestatus',
					rest: 'POST /deployment/request',
                    handler: (ctx: Context<any>) => {
                        this.logger.debug(`Update request status for contract with code ID ${ctx.params.code_id} on Euphoria`);
                        this.createJob(
                            'handle.request-euphoria',
                            {
                                code_id: ctx.params.code_id,
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

    async handleJob(code_id: number, creator_address: string) {
        try {
            this.logger.info(`Update contract(s) with code ID ${code_id} and creator address ${creator_address}`);
        await this.adapter.updateMany({ code_id, creator_address }, { mainnet_upload_status: ContractStatus.TBD });
        } catch (error) {
            this.logger.error(`Error update upload status for contract(s) with code ID ${code_id} and creator address ${creator_address}`);
            this.logger.error(error);
        }
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