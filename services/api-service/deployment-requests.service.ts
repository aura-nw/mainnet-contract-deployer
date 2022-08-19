/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import { Service, Action } from '@ourparentcenter/moleculer-decorators-extended';
import { dbDeploymentRequestsMixin } from '../../mixins/dbMixins';
import { getActionConfig, MainnetUploadStatus, MoleculerDBService, RestOptions } from '../../types';
import { DeploymentRequests } from 'entities';

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
}