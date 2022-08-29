import { Get, Post, Service } from "@ourparentcenter/moleculer-decorators-extended";
import { Context } from "moleculer";
import { ContractDeploymentRequest, ContractVerification, DeploymentRequest, ErrorCode, ErrorMessage, HandleDeploymentRequest, MainnetUploadStatus, MoleculerDBService, RejectDeploymentParams, RequestDeploymentParams, ResponseDto } from "../../types";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
	name: 'deployment',
	version: 1,
	/**
	 * Mixins
	 */
	mixins: [],
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
     *              - code_ids
	 *              properties:
	 *                code_ids:
	 *                  type: array
	 *                  items:
	 *                    type: number
	 *                  description: "Code ids of all contracts in the group"
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
			code_ids: 'number[]'
		},
	})
	async deployContractOnMainnet(ctx: Context<DeploymentRequest>) {
		await ctx.params.code_ids.forEach(async (code_id) => {
			let result: any = await this.broker.call('v1.smart-contracts.getVerifiedContract', { code_id });
			await this.broker.call('v1.handleDeploymentMainnet.handlerequest', { smart_contract: result });
		});
		const response: ResponseDto = {
			code: ErrorCode.SUCCESSFUL,
			message: ErrorMessage.SUCCESSFUL,
			data: null
		};
		return response;
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
     *              - code_ids
     *              - reason
	 *              properties:
	 *                code_ids:
	 *                  type: array
	 *                  items:
	 *                    type: number
	 *                  description: "Code ids of all contracts in the group"
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
			code_ids: 'number[]',
			reason: 'string',
		},
	})
	async rejectContractDeployment(ctx: Context<RejectDeploymentParams>) {
		this.broker.call('v1.handleDeploymentMainnet.rejectrequest', { code_ids: ctx.params.code_ids, reason: ctx.params.reason });
		const response: ResponseDto = {
			code: ErrorCode.SUCCESSFUL,
			message: ErrorMessage.SUCCESSFUL,
			data: null
		};

		return response;
	}
}