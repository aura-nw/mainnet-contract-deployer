/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
import { Service, Action } from '@ourparentcenter/moleculer-decorators-extended';
import { dbSmartContractsMixin } from '../../mixins/dbMixins';
import { ContractVerification, MoleculerDBService } from '../../types';
import { SmartContracts } from 'entities';
import { Context } from 'moleculer';

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
	name: 'smart-contracts',
	version: 1,
	/**
	 * Mixins
	 */
	mixins: [dbSmartContractsMixin],
	/**
	 * Settings
	 */
})
export default class SmartContractsService extends MoleculerDBService<
	{
		rest: 'v1/smartcontracts';
	},
	SmartContracts
> {
	@Action({
		name: 'getVerifiedContract',
	})
	async getVerifiedContract(ctx: Context<any>) {
		const result: any = await this.adapter.findOne({
            where: {
                code_id: ctx.params.code_id,
                contract_verification: [ContractVerification.EXACT_MATCH, ContractVerification.SIMILAR_MATCH]
            }
        });
		return result;
	}
}