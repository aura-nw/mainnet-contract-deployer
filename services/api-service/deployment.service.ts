import { dbSmartContractsMixin } from "../../mixins/dbMixins";
import { Action, Post, Service } from "@ourparentcenter/moleculer-decorators-extended";
import { SmartContracts } from "entities";
import { Context } from "moleculer";
import { ContractDeploymentRequest, ErrorCode, ErrorMessage, HandleDeploymentRequest, MoleculerDBService, ResponseDto } from "../../types";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
	name: 'deployment',
	version: 1,
	/**
	 * Mixins
	 */
	mixins: [dbSmartContractsMixin],
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
	 *  /v1/deployment/request:
	 *    post:
	 *      tags:
	 *      - "Contract Deployment"
	 *      summary:  Request to deploy a contract on mainnet
	 *      description: Request to deploy a contract on mainnet
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            properties:
	 *              code_id:
	 *                required: true
	 *                type: number
	 *                description: "Code id of contract"
	 *      responses:
	 *        200:
	 *          description: Request result
	 *        422:
	 *          description: Missing parameters
	 */
	@Post('/request', {
		name: 'requestContractDeployment',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
		params: {
			code_id: 'number',
		},
	})
	async requestContractDeployment(ctx: Context<ContractDeploymentRequest>) {
		/// Create a request to deploy a contract on mainnet
	}

	/**
	 *  @swagger
	 *
	 *  /v1/deployment/execute:
	 *    post:
	 *      tags:
	 *      - "Contract Deployment"
	 *      summary:  Admin deploy the requested contract on mainnet
	 *      description: Admin deploy the requested contract on mainnet
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            properties:
	 *              code_id:
	 *                required: true
	 *                type: number
	 *                description: "Code id of contract"
	 *      responses:
	 *        200:
	 *          description: Deployment result
	 *        422:
	 *          description: Missing parameters
	 */
	 @Post('/execute', {
		name: 'deployContractOnMainnet',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
		params: {
			code_id: 'number',
		},
	})
	async deployContractOnMainnet(ctx: Context<ContractDeploymentRequest>) {
		const result = await this.adapter.findOne({
			where: {
				code_id: ctx.params.code_id,
				contract_verification: 'EXACT MATCH',
			}
		});
		
		if (!result) {
			const response: ResponseDto = {
				code: ErrorCode.CONTRACT_NOT_FOUND,
				message: ErrorMessage.CONTRACT_NOT_FOUND,
				data: null
			};
			return response;
		}

		this.broker.call('v1.handleDeploymentEuphoria.handlerequest', { smart_contract: result });
		const response: ResponseDto = {
			code: ErrorCode.SUCCESSFUL,
			message: ErrorMessage.SUCCESSFUL,
			data: null
		};

		return response;
	}

	// async getExactContractByCodeId(ctx: Context<HandleDeploymentRequest>) {
	// 	const result = await this.adapter.findOne({
	// 		where: {
	// 			code_id: ctx.params.code_id,
	// 			contract_verification: 'EXACT MATCH',
	// 		}
	// 	});
	// 	console.log(result);
	// 	return result;
	// }
}