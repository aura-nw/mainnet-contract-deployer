import { Get, Post, Service } from "@ourparentcenter/moleculer-decorators-extended";
import { Config } from "../../common";
import { DeploymentRequests } from "../../entities";
import { Context } from "moleculer";
import { DeploymentRequest, ErrorCode, ErrorMessage, GetRequestsParams, ListRequestsParams, MainnetUploadStatus, MoleculerDBService, RejectDeploymentParams, RejectDeploymentRequest, ResponseDto } from "../../types";
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
	 *      parameters:
	 *        - in: query
	 *          name: status
	 *          schema:
	 *            type: string
	 *            enum: ["Approved", "Rejected", "Pending"]
	 *          description: Status of the request
	 *        - in: query
	 *          name: requester_address
	 *          schema:
	 *            type: string
	 *          description: Address of the one create the request
	 *        - in: query
	 *          name: limit
	 *          required: true
	 *          schema:
	 *            type: number
	 *            default: 10
	 *          description: Limit number of requests returned
	 *        - in: query
	 *          name: offset
	 *          required: true
	 *          schema:
	 *            type: number
	 *            default: 0
	 *          description: Number of requests to pass
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
	async getAllRequests(ctx: Context<ListRequestsParams>) {
		let result: any = await this.broker.call('v1.deployment-requests.getAll', {
			status: ctx.params.status,
			requester_address: ctx.params.requester_address,
			limit: ctx.params.limit,
			offset: ctx.params.offset
		} as ListRequestsParams);
		let total: any = await this.broker.call('v1.deployment-requests.getAll', {
			status: '',
			requester_address: '',
			limit: 0,
			offset: 0
		} as ListRequestsParams);
		result.map((req: any) => {
			let pair_ids: any[] = [];
			let ids = req.code_ids.split(',');
			ids.map((id: any) => {
				if (ids.indexOf(id) % 2 === 0) {
					pair_ids.push({
						euphoria_code_id: id,
						mainnet_code_id: ids[ids.indexOf(id) + 1]
					});
				}
			});
			req.code_ids = pair_ids;
		})

		const response: ResponseDto = {
			code: ErrorCode.SUCCESSFUL,
			message: ErrorMessage.SUCCESSFUL,
			data: {
				requests: result,
				total_count: total.length
			}
		};

		return response;
	}

	/**
	 *  @swagger
	 *
	 *  /admin/v1/deployment/details:
	 *    get:
	 *      tags:
	 *        - "Contract Deployment"
	 *      summary:  Show list of all requests
	 *      description: Show list of all requests
	 *      security:
	 *        - bearerAuth: []
	 *      parameters:
	 *        - in: query
	 *          name: request_id
	 *          required: true
	 *          schema:
	 *            type: number
	 *          description: Id of the request
	 *      responses:
	 *        200:
	 *          description: List requests result
	 *        422:
	 *          description: Missing parameters
	 */
	@Get('/details', {
		name: 'getRequestDetails',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
	})
	async getRequestDetails(ctx: Context<GetRequestsParams>) {
		let pair_ids: any[] = [];
		let result: any = await this.broker.call('v1.deployment-requests.getRequests', { request_id: ctx.params.request_id });
		let ids = result.code_ids.split(',');
			ids.map((id: any) => {
				if (ids.indexOf(id) % 2 === 0) {
					pair_ids.push({
						euphoria_code_id: id,
						mainnet_code_id: ids[ids.indexOf(id) + 1]
					});
				}
			});
			result.code_ids = pair_ids;

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
		let code_ids: number[] = [];
		let request: any = await this.broker.call('v1.deployment-requests.getRequests', { request_id: ctx.params.request_id });
		if (!request) {
			const response: ResponseDto = {
				code: ErrorCode.REQUEST_NOT_FOUND,
				message: ErrorMessage.REQUEST_NOT_FOUND,
				data: { request_id: ctx.params.request_id }
			};
			return response;
		} else if (request.status !== MainnetUploadStatus.PENDING) {
			const response: ResponseDto = {
				code: ErrorCode.REQUEST_NOT_PENDING,
				message: ErrorMessage.REQUEST_NOT_PENDING,
				data: { request_id: ctx.params.request_id }
			};
			return response;
		}
		let ids = request.code_ids.split(',');
		ids.map((id: any) => {
			if (ids.indexOf(id) % 2 === 0) {
				code_ids.push(parseInt(id));
			}
		});
		for (let id of code_ids) {
			this.createJob(
				'handle.deployment-mainnet',
				{
					code_id: id,
					request_id: ctx.params.request_id,
					creator_address: request.requester_address
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
		let request: any = await this.broker.call('v1.deployment-requests.getRequests', { request_id: ctx.params.request_id });
		if (!request) {
			const response: ResponseDto = {
				code: ErrorCode.REQUEST_NOT_FOUND,
				message: ErrorMessage.REQUEST_NOT_FOUND,
				data: { request_id: ctx.params.request_id }
			};
			return response;
		} else if (request.status !== MainnetUploadStatus.PENDING) {
			const response: ResponseDto = {
				code: ErrorCode.REQUEST_NOT_PENDING,
				message: ErrorMessage.REQUEST_NOT_PENDING,
				data: { request_id: ctx.params.request_id }
			};
			return response;
		}
		let ids = request.code_ids.split(',');
		ids.map((id: any) => {
			if (ids.indexOf(id) % 2 === 0) {
				code_ids.push(parseInt(id));
			}
		});
		this.createJob(
			'reject.deployment-mainnet',
			{
				code_ids,
				reason: ctx.params.reason,
				request_id: ctx.params.request_id,
				creator_address: request.requester_address
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