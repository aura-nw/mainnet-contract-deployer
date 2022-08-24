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
	 *  /v1/deployment/all-requests:
	 *    get:
	 *      tags:
	 *      - "Contract Deployment"
	 *      summary:  Show list of all requests
	 *      description: Show list of all requests
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
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
	 *              code_ids:
	 *                required: true
	 *                type: array
	 *                items:
	 *                  type: number
	 *                description: "Code ids of all contracts in the group"
	 *              name:
	 *                required: true
	 *                type: string
	 *                description: "Name of subscriber"
	 *              email:
	 *                required: true
	 *                type: string
	 *                description: "Email of subscriber"
	 *              contract_description:
	 *                required: true
	 *                type: string
	 *                description: "Description of contract(s)"
	 *              project_name:
	 *                required: false
	 *                type: string
	 *                description: "Project name"
	 *              official_project_website:
	 *                required: false
	 *                type: string
	 *                description: "Official project website"
	 *              official_project_email:
	 *                required: false
	 *                type: string
	 *                description: "Official project email"
	 *              project_sector:
	 *                required: false
	 *                type: string
	 *                description: "Sector of the contract in the project"
	 *              whitepaper:
	 *                required: false
	 *                type: string
	 *                description: "Official project whitepaper"
	 *              github:
	 *                required: false
	 *                type: string
	 *                description: "Official project github"
	 *              telegram:
	 *                required: false
	 *                type: string
	 *                description: "Official project telegram"
	 *              discord:
	 *                required: false
	 *                type: string
	 *                description: "Official project discord"
	 *              facebook:
	 *                required: false
	 *                type: string
	 *                description: "Official project facebook"
	 *              twitter:
	 *                required: false
	 *                type: string
	 *                description: "Official project twitter"
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
			code_ids: 'number[]',
			name: 'string',
			email: 'string',
			contract_description: 'string',
			project_name: 'string',
			official_project_website: 'string',
			official_project_email: 'string',
			project_sector: 'string',
			whitepaper: 'string',
			github: 'string',
			telegram: 'string',
			discord: 'string',
			facebook: 'string',
			twitter: 'string',
		},
	})
	async requestContractDeployment(ctx: Context<RequestDeploymentParams>) {
		let notFoundContracts: number[] = [];
		let name = ctx.params.name;
		let email = ctx.params.email;
		let contract_description = ctx.params.contract_description;
		let project_name = ctx.params.project_name;
		let official_project_website = ctx.params.official_project_website;
		let official_project_email = ctx.params.official_project_email;
		let project_sector = ctx.params.project_sector;
		let whitepaper = ctx.params.whitepaper;
		let github = ctx.params.github;
		let telegram = ctx.params.telegram;
		let discord = ctx.params.discord;
		let facebook = ctx.params.facebook;
		let twitter = ctx.params.twitter;
		let currentRequestId: number = await this.broker.call('v1.deployment-requests.getLatestRequestId');
		let request_id = currentRequestId + 1;
		ctx.params.code_ids.map(async (code_id) => {
			let result: any = await this.broker.call('v1.smart-contracts.getVerifiedContract', { code_id });

			if (!result) {
				notFoundContracts.push(code_id);
			} else {
				let contract_hash = result.contract_hash;
				let url = result.url;
				let instantiate_msg_schema = result.instantiate_msg_schema;
				let query_msg_schema = result.query_msg_schema;
				let execute_msg_schema = result.execute_msg_schema;
				let compiler_version = result.compiler_version;
				this.broker.call('v1.handleRequestEuphoria.updatestatus', { code_id });
				this.broker.call('v1.handleRequestMainnet.updatestatus', {
					code_id,
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
					contract_hash,
					url,
					instantiate_msg_schema,
					query_msg_schema,
					execute_msg_schema,
					compiler_version,
					request_id
				});
			}
		});
		if (notFoundContracts.length > 0) {
			const response: ResponseDto = {
				code: ErrorCode.CONTRACT_NOT_FOUND,
				message: ErrorMessage.CONTRACT_NOT_FOUND,
				data: { contracts: notFoundContracts }
			};
			return response;
		}
		const response: ResponseDto = {
			code: ErrorCode.SUCCESSFUL,
			message: ErrorMessage.REQUEST_SUCCESSFUL,
			data: { contracts: ctx.params.code_ids }
		};
		return response;
	}

	/**
	 *  @swagger
	 *
	 *  /v1/deployment/execute:
	 *    post:
	 *      tags:
	 *      - "Contract Deployment"
	 *      summary:  Admin deploy the requested contract(s) on mainnet
	 *      description: Admin deploy the requested contract(s) on mainnet
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
	 *              code_ids:
	 *                required: true
	 *                type: array
	 *                items:
	 *                  type: number
	 *                description: "Code ids of all contracts in the group"
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
			code_ids: 'number[]'
		},
	})
	async deployContractOnMainnet(ctx: Context<DeploymentRequest>) {
		let notFoundContracts: number[] = [];
		ctx.params.code_ids.map(async (code_id) => {
			let result: any = await this.broker.call('v1.smart-contracts.getVerifiedContract', { code_id });

			if (!result) {
				notFoundContracts.push(code_id);
			} else {
				this.broker.call('v1.handleDeploymentMainnet.handlerequest', { smart_contract: result });
			}
		});
		if (notFoundContracts.length > 0) {
			const response: ResponseDto = {
				code: ErrorCode.CONTRACT_NOT_FOUND,
				message: ErrorMessage.CONTRACT_NOT_FOUND,
				data: { contracts: notFoundContracts }
			};
			return response;
		}
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
	 *  /v1/deployment/reject:
	 *    post:
	 *      tags:
	 *      - "Contract Deployment"
	 *      summary:  Admin reject the requested contract on mainnet
	 *      description: Admin reject the requested contract on mainnet
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
	 *              code_ids:
	 *                required: true
	 *                type: array
	 *                items:
	 *                  type: number
	 *                description: "Code ids of all contracts in the group"
	 *              reason:
	 *                required: true
	 *                type: string
	 *                description: "Reason for rejection"
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