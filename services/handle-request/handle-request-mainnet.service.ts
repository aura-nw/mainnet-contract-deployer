import CallApiMixin from "../../mixins/callApi/call-api.mixin";
import { Context, Service, ServiceBroker } from "moleculer";
import { Job } from "bull";
import { Config } from "../../common";
import { ContractVerification, HandleRequestParams, MainnetUploadStatus } from "../../types";
import { dbDeploymentRequestsMixin } from "../../mixins/dbMixins";
const QueueService = require('moleculer-bull');

export default class HandleRequestMainnetService extends Service {
    private callApiMixin = new CallApiMixin().start();
    private dbDeploymentRequestsMixin = dbDeploymentRequestsMixin;

    public constructor(public broker: ServiceBroker) {
        super(broker);
        this.parseServiceSchema({
            name: 'handleRequestMainnet',
            version: 1,
            mixins: [
                QueueService(
                    `redis://${Config.REDIS_USERNAME}:${Config.REDIS_PASSWORD}@${Config.REDIS_HOST}:${Config.REDIS_PORT}/${Config.REDIS_DB_NUMBER}`,
                    {
                        prefix: 'handle.request-mainnet',
                    },
                ),
                // this.redisMixin,
                this.dbDeploymentRequestsMixin,
                this.callApiMixin,
            ],
            queues: {
                'handle.request-mainnet': {
                    concurrency: parseInt(Config.CONCURRENCY_HANDLE_REQUEST, 10),
                    process(job: Job) {
                        job.progress(10);
                        // @ts-ignore
                        this.handleJob(
                            job.data.code_id,
                            job.data.name,
                            job.data.email,
                            job.data.contract_description,
                            job.data.project_name,
                            job.data.official_project_website,
                            job.data.official_project_email,
                            job.data.project_sector,
                            job.data.whitepaper,
                            job.data.github,
                            job.data.telegram,
                            job.data.discord,
                            job.data.facebook,
                            job.data.twitter,
                            job.data.contract_hash,
                            job.data.url,
                            job.data.instantiate_msg_schema,
                            job.data.query_msg_schema,
                            job.data.execute_msg_schema,
                            job.data.compiler_version,
                            job.data.request_id
                        );
                        job.progress(100);
                        return true;
                    },
                }
            },
            actions: {
                updatestatus: {
                    name: 'updatestatus',
                    rest: 'POST /deployment/request',
                    handler: (ctx: Context<HandleRequestParams>) => {
                        this.logger.debug(`Store deployment request for contract with code ID ${ctx.params.code_id} on Euphoria`);
                        this.createJob(
                            'handle.request-mainnet',
                            {
                                code_id: ctx.params.code_id,
                                name: ctx.params.name,
                                email: ctx.params.email,
                                contract_description: ctx.params.contract_description,
                                project_name: ctx.params.project_name,
                                official_project_website: ctx.params.official_project_website,
                                official_project_email: ctx.params.official_project_email,
                                project_sector: ctx.params.project_sector,
                                whitepaper: ctx.params.whitepaper,
                                github: ctx.params.github,
                                telegram: ctx.params.telegram,
                                discord: ctx.params.discord,
                                facebook: ctx.params.facebook,
                                twitter: ctx.params.twitter,
                                contract_hash: ctx.params.contract_hash,
                                url: ctx.params.url,
                                instantiate_msg_schema: ctx.params.instantiate_msg_schema,
                                query_msg_schema: ctx.params.query_msg_schema,
                                execute_msg_schema: ctx.params.execute_msg_schema,
                                compiler_version: ctx.params.compiler_version,
                                request_id: ctx.params.request_id
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

    async handleJob(
        code_id: number,
        name: string,
        email: string,
        contract_description: string,
        project_name: string,
        official_project_website: string,
        official_project_email: string,
        project_sector: string,
        whitepaper: string,
        github: string,
        telegram: string,
        discord: string,
        facebook: string,
        twitter: string,
        contract_hash: string,
        url: string,
        instantiate_msg_schema: string,
        query_msg_schema: string,
        execute_msg_schema: string,
        compiler_version: string,
        request_id: number
    ) {
        const deploymentRequest = {
            name,
            email,
            contract_description,
            project_name,
            official_project_website,
            official_project_email,
            project_sector,
            whitepaper,
            github,
            telegram,
            discord,
            facebook,
            twitter,
            euphoria_code_id: code_id,
            contract_hash,
            url,
            instantiate_msg_schema,
            query_msg_schema,
            execute_msg_schema,
            compiler_version,
            status: MainnetUploadStatus.PENDING,
            request_id
        };
        const result = await this.adapter.insert(deploymentRequest);
        this.logger.info('Request inserted into database', result);
    }

    async _start() {
        this.getQueue('handle.request-mainnet').on('completed', (job: Job) => {
            this.logger.info(`Job #${job.id} completed!. Result:`, job.returnvalue);
        });
        this.getQueue('handle.request-mainnet').on('failed', (job: Job) => {
            this.logger.error(`Job #${job.id} failed!. Result:`, job.stacktrace);
        });
        this.getQueue('handle.request-mainnet').on('progress', (job: Job) => {
            this.logger.info(`Job #${job.id} progress is ${job.progress()}%`);
        });
        return super._start();
    }
}