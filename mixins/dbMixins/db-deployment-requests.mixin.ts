'use strict';

import { Config } from "../../common";
import { DbBaseMixin } from "./db-base.mixin";

const dbInfo = Config.DB_DEPLOYMENT_REQUESTS;

const dbBaseMixin = new DbBaseMixin({
    dbInfo,
    name: 'dbDeploymentRequestsMixin',
    collection: dbInfo.collection,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    model: {
        name: 'deployment_requests',
        define: {
            id: {
                type: Number,
                primaryKey: true,
            },
            created_at: Date,
            updated_at: Date,
            name: String,
            email: String,
            contract_description: String,
            project_name: String,
            official_project_website: String,
            official_project_email: String,
            project_sector: String,
            whitepaper: String,
            github: String,
            telegram: String,
            discord: String,
            facebook: String,
            twitter: String,
            euphoria_code_id: Number,
            mainnet_code_id: Number,
            contract_hash: String,
            url: String,
            instantiate_msg_schema: String,
            query_msg_schema: String,
            execute_msg_schema: String,
            compiler_version: String,
            status: String,
            reason: String,
        }
    },
});

export const dbDeploymentRequestsMixin = dbBaseMixin.getMixin();