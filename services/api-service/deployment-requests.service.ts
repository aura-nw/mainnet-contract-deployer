/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import { Service, Action } from '@ourparentcenter/moleculer-decorators-extended';
import { dbDeploymentRequestsMixin } from '../../mixins/dbMixins';
import { DeploymentRequest, getActionConfig, GetRequestsParams, MainnetUploadStatus, MoleculerDBService, RestOptions, UpdateRequestDeploymentParams, UpdateRequestParams } from '../../types';
import { DeploymentRequests } from 'entities';
import { Context } from 'moleculer';

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
	name: 'deployment-requests',
	version: 1,
	/**
	 * Mixins
	 */
	mixins: [dbDeploymentRequestsMixin],
	/**
	 * Settings
	 */
})
export default class DeploymentRequestsService extends MoleculerDBService<
	{
		rest: 'v1/deploymentrequests';
	},
	DeploymentRequests
> {
	@Action({
		name: 'getAll',
	})
	async getAll() {
		const result = await this.adapter.find({});
		return result;
	}

	@Action({
		name: 'getRequests',
	})
	async getRequests(ctx: Context<DeploymentRequest>) {
		const result = await this.adapter.find({
			query: {
				request_id: ctx.params.request_id,
			},
		});
		return result;
	}

	@Action({
		name: 'getLatestRequestId',
	})
	async getLatestRequestId() {
		const result: any = await this.adapter.find({
			limit: 1,
			// @ts-ignore
			sort: '-request_id',
		});
		if (result.length === 0) return 0;
		return result[0].request_id;
	}

	@Action({
		name: 'updateRequests',
	})
	async updateRequests(ctx: Context<UpdateRequestParams>) {
		const result: any = await this.adapter.updateMany(
			{
				request_id: ctx.params.request_id,
			},
			{
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
				status: ctx.params.status,
				reason: ctx.params.reason,
			},
		);
		return result;
	}
}