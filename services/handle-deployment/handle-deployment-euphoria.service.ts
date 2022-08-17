import CallApiMixin from "../../mixins/callApi/call-api.mixin";
import { Context, Service, ServiceBroker } from "moleculer";
import { Job } from "bull";
import { Config } from "../../common";
import { HandleDeploymentRequest } from "types";
import { SmartContracts } from "entities";
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
                    process(job: Job) {
                        job.progress(10);
                        // @ts-ignore
                        this.handleJob(job.data.smart_contract);
                        job.progress(100);
                        return true;
                    },
                }
            },
            actions: {
                handlerequest: {
                    name: 'handlerequest',
					rest: 'POST /deployment/execute',
                    handler: (ctx: Context<HandleDeploymentRequest>) => {
                        this.logger.debug(`Handle contract deployment request`);
                        this.createJob(
                            'handle.deployment-euphoria',
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
        const codeId: string = await this.broker.call('v1.handleDeploymentMainnet.executedeployment', { smart_contract });
        if(codeId == '') {
            this.logger.error(`Failed to store code for Euphoria contract with code ID ${smart_contract.code_id}`);
            return;
        }
        smart_contract.contract_references = codeId;
        await this.adapter.updateById(smart_contract.id, smart_contract);
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
        return super._start();
    }
}