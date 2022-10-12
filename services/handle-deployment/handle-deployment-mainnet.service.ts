import CallApiMixin from "../../mixins/callApi/call-api.mixin";
import { Context, Service, ServiceBroker } from "moleculer";
import { Job } from "bull";
import { Config } from "../../common";
import { AppConstants, ContractDeploymentRequest, MainnetUploadStatus, RejectDeploymentParams } from "../../types";
import { DeploymentRequests, SmartContracts } from "../../entities";
import { dbDeploymentRequestsMixin } from "../../mixins/dbMixins";
import { KMSSigner, Network } from "../../utils";
import { GasPrice, StdFee } from '@cosmjs/stargate';
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
const QueueService = require('moleculer-bull');
const nodemailer = require("nodemailer");
import QueueConfig from '../../common/queue';

export default class HandleDeploymentMainnetService extends Service {
    private callApiMixin = new CallApiMixin().start();
    private dbDeploymentRequestsMixin = dbDeploymentRequestsMixin;
    private network: Network = {} as Network;
    private defaultGasPrice = GasPrice.fromString(Config.DEFAULT_GAS_PRICE);

    public constructor(public broker: ServiceBroker) {
        super(broker);
        this.parseServiceSchema({
            name: 'handleDeploymentMainnet',
            version: 1,
            mixins: [
                QueueService(QueueConfig.redis, QueueConfig.opts),
                // this.redisMixin,
                this.dbDeploymentRequestsMixin,
                this.callApiMixin,
            ],
            queues: {
                'handle.deployment-mainnet': {
                    concurrency: parseInt(Config.CONCURRENCY_HANDLE_DEPLOYMENT, 10),
                    async process(job: Job) {
                        job.progress(10);
                        // @ts-ignore
                        await this.handleJob(job.data.code_idss, job.data.request_id, job.data.creator_address);
                        job.progress(100);
                        return true;
                    },
                },
                'reject.deployment-mainnet': {
                    concurrency: parseInt(Config.CONCURRENCY_HANDLE_DEPLOYMENT, 10),
                    async process(job: Job) {
                        job.progress(10);
                        // @ts-ignore
                        await this.handleRejectionJob(job.data.code_ids, job.data.reason, job.data.request_id, job.data.creator_address);
                        job.progress(100);
                        return true;
                    },
                }
            },
            actions: {
                handlerequest: {
                    name: 'handlerequest',
                    handler: (ctx: Context<ContractDeploymentRequest>) => {
                        this.logger.debug(`Deploy contract on mainnet`);
                        this.createJob(
                            'handle.deployment-mainnet',
                            {
                                code_ids: ctx.params.code_ids,
                                request_id: ctx.params.request_id,
                                creator_address: ctx.params.creator_address
                            },
                            {
                                removeOnComplete: true,
                            }
                        );
                    }
                },
                rejectrequest: {
                    name: 'rejectrequest',
                    handler: (ctx: Context<RejectDeploymentParams>) => {
                        this.logger.debug(`Reject deployment request of contract on mainnet`);
                        this.createJob(
                            'reject.deployment-mainnet',
                            {
                                code_ids: ctx.params.code_ids,
                                reason: ctx.params.reason,
                                request_id: ctx.params.request_id,
                                creator_address: ctx.params.creator_address
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

    async handleJob(code_ids: number[], request_id: number, creator_address: string) {
        try {
            for (let code_id of code_ids) {
                const client = await CosmWasmClient.connect(Config.BASE_RPC);
                const codeDetails = await client.getCodeDetails(code_id);
                this.logger.info('Code details:', codeDetails);

                // Get signer
                const signer = new KMSSigner(Config.SIGNER_WALLET_ADDRESS);

                // Get system address info
                const account = await signer.getAccount();
                this.logger.info('System account:', account);

                // Connect network
                this.network = await Network.connectWithSigner(
                    Config.TARGET_RPC,
                    account,
                    signer,
                    { gasPrice: this.defaultGasPrice }
                );

                const codeId = await this.storeCode(account.address, codeDetails.data, AppConstants.AUTO);
                this.logger.info('Code id:', codeId);

                this.logger.info(`Update request ${request_id} with base code id ${code_id}`);
                const [request, _]: [DeploymentRequests, any] = await Promise.all([
                    this.adapter.findOne({
                        where: {
                            euphoria_code_id: code_id,
                            status: [MainnetUploadStatus.ERROR, MainnetUploadStatus.PENDING]
                        }
                    }),
                    this.adapter.updateMany(
                        {
                            euphoria_code_id: code_id,
                            status: [MainnetUploadStatus.PENDING, MainnetUploadStatus.ERROR]
                        },
                        {
                            mainnet_code_id: codeId
                        }
                    )
                ]);

                await this.sendEmail(
                    request.email,
                    'Contract upload on Mainnet successful!',
                    `
                <p>Your contract source code with code ID ${request.euphoria_code_id} on Euphoria has been uploaded on Mainnet</p>
                <p>Code ID on Mainnet: ${codeId}</p>
            `,
                );

                this.broker.call('v1.handleDeploymentEuphoria.executedeployment', {
                    euphoria_code_id: code_id,
                    mainnet_code_id: codeId,
                    creator_address,
                    project_name: request.project_name,
                    request_id: request.request_id,
                });
            }

            const requests = await this.adapter.find({
                query: {
                    request_id,
                }
            });
            let status = MainnetUploadStatus.SUCCESS;
            requests.map((r: DeploymentRequests) => {
                if (r.mainnet_code_id === 0) status = MainnetUploadStatus.ERROR;
            })

            this.logger.info(`Update request ${request_id} with status ${status}`);
            await this.adapter.updateMany(
                {
                    euphoria_code_id: code_ids,
                    status: [MainnetUploadStatus.PENDING, MainnetUploadStatus.ERROR]
                },
                {
                    status,
                }
            );
        } catch (error: any) {
            this.logger.error(error);
            await this.adapter.updateMany(
                {
                    request_id,
                },
                {
                    status: MainnetUploadStatus.ERROR,
                }
            );
        }
    }

    async handleRejectionJob(code_ids: number[], reason: string, request_id: number, creator_address: string) {
        try {
            const request: DeploymentRequests = await this.adapter.findOne({
                where: {
                    euphoria_code_id: code_ids[0],
                    status: [MainnetUploadStatus.ERROR, MainnetUploadStatus.PENDING]
                }
            });

            this.logger.error(`Update request ${request_id} with status ${MainnetUploadStatus.REJECTED}`);
            await this.adapter.updateMany(
                {
                    request_id,
                    status: [MainnetUploadStatus.PENDING, MainnetUploadStatus.ERROR]
                },
                {
                    status: MainnetUploadStatus.REJECTED,
                    reason,
                }
            );

            await this.sendEmail(
                request.email,
                'Request upload contract on Mainnet rejected!',
                `
                    <p>Your request to upload contract source code with code ID(s) ${code_ids} on Euphoria to Mainnet has been rejected!</p>
                    <p>Reason: ${reason}</p>
                `,
            );

            this.broker.call('v1.handleDeploymentEuphoria.rejectdeployment', { code_ids, creator_address });
        } catch (error: any) {
            this.logger.error(error);
            await this.adapter.updateMany(
                {
                    request_id,
                },
                {
                    status: MainnetUploadStatus.ERROR,
                }
            );
        }
    }

    async storeCode(senderAddress: string, wasmCode: Uint8Array, fee: StdFee | 'auto' | number) {
        const result = await this.network.upload(senderAddress, wasmCode, fee);
        if (!result.codeId) {
            this.logger.error(result);
            return '';
        }
        return result.codeId;
    }

    async sendEmail(to: string | undefined, subject: string, html: string) {
        try {
            const transporter = nodemailer.createTransport({
                host: Config.AURA_HOST,
                port: Config.AURA_PORT,
                secureConnection: false,
                tls: {
                    ciphers: 'SSLv3',
                },
                auth: {
                    user: Config.EMAIL_USER,
                    pass: Config.EMAIL_PASSWORD,
                }
            });
            await transporter.sendMail({
                from: Config.AURA_EMAIL,
                to,
                subject,
                html,
            });
        } catch (error) {
            this.logger.error(`Error when sending email to ${to}`, error);
        }
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

        this.getQueue('reject.deployment-mainnet').on('completed', (job: Job) => {
            this.logger.info(`Job #${job.id} completed!. Result:`, job.returnvalue);
        });
        this.getQueue('reject.deployment-mainnet').on('failed', (job: Job) => {
            this.logger.error(`Job #${job.id} failed!. Result:`, job.stacktrace);
        });
        this.getQueue('reject.deployment-mainnet').on('progress', (job: Job) => {
            this.logger.info(`Job #${job.id} progress is ${job.progress()}%`);
        });

        return super._start();
    }
}