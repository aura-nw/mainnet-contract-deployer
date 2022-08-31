import { Get, Post, Service } from "@ourparentcenter/moleculer-decorators-extended";
import { Config } from "common";
import { DeploymentRequests } from "entities";
import { Context } from "moleculer";
import { DeploymentRequest, ErrorCode, ErrorMessage, MainnetUploadStatus, MoleculerDBService, RejectDeploymentParams, RejectDeploymentRequest, ResponseDto } from "../../types";
const QueueService = require('moleculer-bull');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
	name: 'deployment',
	version: 1,
	/**
	 * Mixins
	 */
	mixins: [
		QueueService(
			`redis://${Config.REDIS_USERNAME}:${Config.REDIS_PASSWORD}@${Config.REDIS_HOST}:${Config.REDIS_PORT}/${Config.REDIS_DB_NUMBER}`,
			{
				prefix: 'handle.deployment-mainnet',
			},
		),
	],
	/**
	 * Settings
	 */
})
export default class DeploymentService extends MoleculerDBService<
{
	rest: 'v1/deployment';
},
{}
> {
	/**
	 *  @swagger
	 *
	 *  /admin/v1/deployment/all-requests:
	 *    get:
	 *      tags:
	 *        - "Contract Deployment"
	 *      summary:  Show list of all requests
	 *      description: Show list of all requests
	 *      security:
	 *        - bearerAuth: []
	 *      responses:
	 *        200:
	 *          description: List requests result
	 *        422:
	 *          description: Missing parameters
	 */
	@Get('/all-requests', {
		name: 'getAllRequests',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
	})
	async getAllRequests() {
		let result = await this.broker.call('v1.deployment-requests.getAll');

		const response: ResponseDto = {
			code: ErrorCode.SUCCESSFUL,
			message: ErrorMessage.SUCCESSFUL,
			data: result
		};

		return response;
	}

	/**
	 *  @swagger
	 *
	 *  /admin/v1/deployment/approve:
	 *    post:
	 *      tags:
	 *        - "Contract Deployment"
	 *      summary:  Admin deploy the requested contract(s) on mainnet
	 *      description: Admin deploy the requested contract(s) on mainnet
	 *      security:
	 *        - bearerAuth: []
	 *      requestBody:
	 *        content:
	 *          application/json:
	 *            schema:
	 *              type: object
	 *              required:
	 *              - request_id
	 *              properties:
	 *                request_id:
	 *                  type: number
	 *                  description: "Id of the request"
	 *      responses:
	 *        200:
	 *          description: Deployment result
	 *        422:
	 *          description: Missing parameters
	 */
	@Post('/approve', {
		name: 'deployContractOnMainnet',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
		params: {
			request_id: 'number'
		},
	})
	async deployContractOnMainnet(ctx: Context<DeploymentRequest>) {
		let requests: DeploymentRequests[] = await this.broker.call('v1.deployment-requests.getRequests', { request_id: ctx.params.request_id });
		if (requests.length === 0) {
			const response: ResponseDto = {
				code: ErrorCode.REQUEST_NOT_FOUND,
				message: ErrorMessage.REQUEST_NOT_FOUND,
				data: { request_id: ctx.params.request_id }
			};
			return response;
		} else if (requests[0].status !== MainnetUploadStatus.PENDING) {
			const response: ResponseDto = {
				code: ErrorCode.REQUEST_NOT_PENDING,
				message: ErrorMessage.REQUEST_NOT_PENDING,
				data: { request_id: ctx.params.request_id }
			};
			return response;
		}
		for (let req of requests) {
			this.createJob(
				'handle.deployment-mainnet',
				{
					code_id: req.euphoria_code_id,
				},
				{
					removeOnComplete: true,
				}
			);
		}
		return {
			code: ErrorCode.SUCCESSFUL,
			message: ErrorMessage.SUCCESSFUL,
			data: null
		};
	}

	/**
	 *  @swagger
	 *
	 *  /admin/v1/deployment/reject:
	 *    post:
	 *      tags:
	 *        - "Contract Deployment"
	 *      summary:  Admin reject the requested contract on mainnet
	 *      description: Admin reject the requested contract on mainnet
	 *      security:
	 *        - bearerAuth: []
	 *      requestBody:
	 *        content:
	 *          application/json:
	 *            schema:
	 *              type: object
	 *              required:
	 *              - request_id
	 *              - reason
	 *              properties:
	 *                request_id:
	 *                  type: number
	 *                  description: "Id of the request"
	 *                reason:
	 *                  type: string
	 *                  description: "Reason for rejection"
	 *      responses:
	 *        200:
	 *          description: Reject result
	 *        422:
	 *          description: Missing parameters
	 */
	@Post('/reject', {
		name: 'rejectContractDeployment',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
		params: {
			request_id: 'number',
			reason: 'string',
		},
	})
	async rejectContractDeployment(ctx: Context<RejectDeploymentRequest>) {
		let code_ids: number[] = [];
		let requests: DeploymentRequests[] = await this.broker.call('v1.deployment-requests.getRequests', { request_id: ctx.params.request_id });
		if (requests.length === 0) {
			const response: ResponseDto = {
				code: ErrorCode.REQUEST_NOT_FOUND,
				message: ErrorMessage.REQUEST_NOT_FOUND,
				data: { request_id: ctx.params.request_id }
			};
			return response;
		} else if (requests[0].status !== MainnetUploadStatus.PENDING) {
			const response: ResponseDto = {
				code: ErrorCode.REQUEST_NOT_PENDING,
				message: ErrorMessage.REQUEST_NOT_PENDING,
				data: { request_id: ctx.params.request_id }
			};
			return response;
		}
		requests.map(request => {
			code_ids.push(request.euphoria_code_id!);
		});
		this.createJob(
			'reject.deployment-mainnet',
			{
				code_ids,
				reason: ctx.params.reason,
			},
			{
				removeOnComplete: true,
			}
		);
		return {
			code: ErrorCode.SUCCESSFUL,
			message: ErrorMessage.SUCCESSFUL,
			data: null
		};
	}
}