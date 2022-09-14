/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import { Service, Action } from '@ourparentcenter/moleculer-decorators-extended';
import { dbDeploymentRequestsMixin } from '../../mixins/dbMixins';
import { DeploymentRequest, getActionConfig, GetRequestsParams, ListRequestsParams, MainnetUploadStatus, MoleculerDBService } from '../../types';
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
	async getAll(ctx: Context<ListRequestsParams>) {
		let query = `
			SELECT * FROM ( 
				SELECT *, GROUP_CONCAT(DISTINCT CONCAT(euphoria_code_id,',',mainnet_code_id) SEPARATOR ' | ') AS code_ids 
				FROM deployment_requests 
				GROUP BY request_id) dr
		`;
		if ((ctx.params.status && ctx.params.status !== '') || (ctx.params.requester_address && ctx.params.requester_address !== '')) {
			query += `WHERE `;
			if (ctx.params.status && ctx.params.status !== '') 
				query += `status = '${ctx.params.status}'`;
			if (ctx.params.requester_address && ctx.params.requester_address !== '') {
				if (ctx.params.status && ctx.params.status !== '') query += ` AND `;
				query += `requester_address = '${ctx.params.requester_address}'`;
			}
		}
		query += ` LIMIT ${ctx.params.limit} OFFSET ${ctx.params.offset};`;
		// @ts-ignore
		const result = await this.adapter.db.query(query, { type: 'SELECT' });
		return result;
	}

	@Action({
		name: 'getRequests',
	})
	async getRequests(ctx: Context<DeploymentRequest>) {
		// @ts-ignore
		const result = await this.adapter.db.query(`
			SELECT * FROM ( 
				SELECT *, GROUP_CONCAT(DISTINCT CONCAT(euphoria_code_id,',',mainnet_code_id) SEPARATOR ' | ') AS code_ids 
				FROM deployment_requests 
				GROUP BY request_id) dr 
			WHERE request_id = ${ctx.params.request_id};
		`, { type: 'SELECT' });
		return result[0];
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
}