import { Get, Post, Service } from "@ourparentcenter/moleculer-decorators-extended";
import { DeploymentRequests } from "entities";
import { Context } from "moleculer";
import { ErrorCode, ErrorMessage, MainnetUploadStatus, MoleculerDBService, RequestDeploymentParams, ResponseDto, UpdateRequestDeploymentParams } from "../../types";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
	name: 'request',
	version: 1,
	/**
	 * Mixins
	 */
	mixins: [],
	/**
	 * Settings
	 */
	// authentication: true,
	// settings: {
	//     routes: [{
	//         authentication: true
	//     }]
	// },
})
export default class RequestService extends MoleculerDBService<
{
	rest: 'v1/request';
},
{}
> {
	/**
	 *  @swagger
	 *
	 *  /api/v1/request/create:
	 *    post:
	 *      tags:
	 *        - "Requests"
	 *      summary:  Request to deploy a contract on mainnet
	 *      description: Request to deploy a contract on mainnet
	 *      requestBody:
	 *        content:
	 *          application/json:
	 *            schema:
	 *              type: object
	 *              required:
	 *              - code_ids
	 *              - name
	 *              - email
	 *              - contract_description
	 *              properties:
	 *                code_ids:
	 *                  type: array
	 *                  items:
	 *                    type: number
	 *                  description: "Code ids of all contracts in the group"
	 *                name:
	 *                  type: string
	 *                  description: "Name of subscriber"
	 *                email:
	 *                  type: string
	 *                  description: "Email of subscriber"
	 *                contract_description:
	 *                  type: string
	 *                  description: "Description of contract(s)"
	 *                project_name:
	 *                  type: string
	 *                  description: "Project name"
	 *                official_project_website:
	 *                  type: string
	 *                  description: "Official project website"
	 *                official_project_email:
	 *                  type: string
	 *                  description: "Official project email"
	 *                project_sector:
	 *                  type: string
	 *                  description: "Sector of the contract in the project"
	 *                whitepaper:
	 *                  type: string
	 *                  description: "Official project whitepaper"
	 *                github:
	 *                  type: string
	 *                  description: "Official project github"
	 *                telegram:
	 *                  type: string
	 *                  description: "Official project telegram"
	 *                discord:
	 *                  type: string
	 *                  description: "Official project discord"
	 *                facebook:
	 *                  type: string
	 *                  description: "Official project facebook"
	 *                twitter:
	 *                  type: string
	 *                  description: "Official project twitter"
	 *      responses:
	 *        200:
	 *          description: Request result
	 *        422:
	 *          description: Missing parameters
	 */
	@Post('/create', {
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
		let deployedContracts: number[] = [];
		let pendingContracts: number[] = [];
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
		await Promise.all(ctx.params.code_ids.map(async (code_id) => {
			let result: any = await this.broker.call('v1.smart-contracts.getVerifiedContract', { code_id });

			if (!result) {
				notFoundContracts.push(code_id);
			} else if (result.mainnet_upload_status === MainnetUploadStatus.SUCCESS) {
				deployedContracts.push(code_id);
			} else if (result.mainnet_upload_status === MainnetUploadStatus.PENDING) {
				pendingContracts.push(code_id);
			} else {
				let contract_hash = result.contract_hash;
				let url = result.url;
				let instantiate_msg_schema = result.instantiate_msg_schema;
				let query_msg_schema = result.query_msg_schema;
				let execute_msg_schema = result.execute_msg_schema;
				let compiler_version = result.compiler_version;
				let s3_location = result.s3_location;
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
					s3_location,
					request_id
				});
			}
		}));
		if (notFoundContracts.length > 0) {
			const response: ResponseDto = {
				code: ErrorCode.CONTRACT_NOT_FOUND,
				message: ErrorMessage.CONTRACT_NOT_FOUND,
				data: { contracts: notFoundContracts }
			};
			return response;
		}
		if (deployedContracts.length > 0) {
			const response: ResponseDto = {
				code: ErrorCode.CONTRACT_ALREADY_UPLOADED,
				message: ErrorMessage.CONTRACT_ALREADY_UPLOADED,
				data: { contracts: deployedContracts },
			};
			return response;
		}
		if (pendingContracts.length > 0) {
			const response: ResponseDto = {
				code: ErrorCode.CONTRACT_ALREADY_REQUESTED,
				message: ErrorMessage.CONTRACT_ALREADY_REQUESTED,
				data: { contracts: pendingContracts },
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
	 *  /api/v1/request/update:
	 *    post:
	 *      tags:
	 *        - "Requests"
	 *      summary:  Update a request to deploy a contract on mainnet
	 *      description: Update a request to deploy a contract on mainnet
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
	 *                name:
	 *                  type: string
	 *                  description: "Name of subscriber"
	 *                email:
	 *                  type: string
	 *                  description: "Email of subscriber"
	 *                contract_description:
	 *                  type: string
	 *                  description: "Description of contract(s)"
	 *                project_name:
	 *                  type: string
	 *                  description: "Project name"
	 *                official_project_website:
	 *                  type: string
	 *                  description: "Official project website"
	 *                official_project_email:
	 *                  type: string
	 *                  description: "Official project email"
	 *                project_sector:
	 *                  type: string
	 *                  description: "Sector of the contract in the project"
	 *                whitepaper:
	 *                  type: string
	 *                  description: "Official project whitepaper"
	 *                github:
	 *                  type: string
	 *                  description: "Official project github"
	 *                telegram:
	 *                  type: string
	 *                  description: "Official project telegram"
	 *                discord:
	 *                  type: string
	 *                  description: "Official project discord"
	 *                facebook:
	 *                  type: string
	 *                  description: "Official project facebook"
	 *                twitter:
	 *                  type: string
	 *                  description: "Official project twitter"
	 *      responses:
	 *        200:
	 *          description: Request result
	 *        422:
	 *          description: Missing parameters
	 */
	@Post('/update', {
		name: 'updateRequestContractDeployment',
		/**
		 * Service guard services allowed to connect
		 */
		restricted: ['api'],
		params: {
			request_id: 'number',
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
	async updateRequestContractDeployment(ctx: Context<UpdateRequestDeploymentParams>) {
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
		let requests: DeploymentRequests[] = await this.broker.call('v1.deployment-requests.getRequests', { request_id: ctx.params.request_id });
		if (requests.length === 0) {
			const response: ResponseDto = {
				code: ErrorCode.REQUEST_NOT_FOUND,
				message: ErrorMessage.REQUEST_NOT_FOUND,
				data: { request_id: ctx.params.request_id }
			};
			return response;
		}
		await this.broker.call(
			'v1.deployment-requests.updateRequests',
			{
				request_id: ctx.params.request_id,
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
				status: MainnetUploadStatus.PENDING,
				reason: ''
			}
		);
		const response: ResponseDto = {
			code: ErrorCode.SUCCESSFUL,
			message: ErrorMessage.UPDATE_REQUEST_SUCCESSFUL,
			data: { requests: ctx.params }
		};
		return response;
	}
}