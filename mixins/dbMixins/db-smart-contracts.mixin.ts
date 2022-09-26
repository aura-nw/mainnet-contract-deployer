'use strict';

import { Config } from "../../common";
import { DbBaseMixin } from "./db-base.mixin";

const dbInfo = Config.DB_SMART_CONTRACTS;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbSmartContractsMixin',
	collection: dbInfo.collection,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	model: {
        name: 'smart_contracts',
        define: {
            id: {
                type: Number,
                primaryKey: true,
            },
            created_at: Date,
            updated_at: Date,
            verified_at: Date,
            height: Number,
            code_id: Number,
            contract_name: String,
            contract_address: String,
            creator_address: String,
            contract_hash: String,
            tx_hash: String,
            url: String,
            instantiate_msg_schema: String,
            query_msg_schema: String,
            execute_msg_schema: String,
            contract_match: String,
            contract_verification: String,
            compiler_version: String,
            s3_location: String,
            reference_code_id: Number,
            mainnet_upload_status: String,
            token_name: String,
            token_symbol: String,
            num_tokens: Number,
        }
    },
});

export const dbSmartContractsMixin = dbBaseMixin.getMixin();