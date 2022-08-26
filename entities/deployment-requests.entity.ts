import { Column, Entity } from "typeorm";
import { BaseEntityIncrementId } from "./base/base.entity";

@Entity('deployment_requests')
export class DeploymentRequests extends BaseEntityIncrementId {
    @Column({ name: 'request_id' })
    request_id: number | undefined;
    
    @Column({ name: 'name' })
    name: string | undefined;

    @Column({ name: 'email' })
    email: string | undefined;

    @Column({ name: 'contract_description' })
    contract_description: string | undefined;

    @Column({ name: 'project_name' })
    project_name: string | undefined;

    @Column({ name: 'official_project_website' })
    official_project_website: string | undefined;

    @Column({ name: 'official_project_email' })
    official_project_email: string | undefined;

    @Column({ name: 'project_sector' })
    project_sector: string | undefined;

    @Column({ name: 'whitepaper' })
    whitepaper: string | undefined;

    @Column({ name: 'github' })
    github: string | undefined;

    @Column({ name: 'telegram' })
    telegram: string | undefined;

    @Column({ name: 'discord' })
    discord: string | undefined;

    @Column({ name: 'facebook' })
    facebook: string | undefined;

    @Column({ name: 'twitter' })
    twitter: string | undefined;

    @Column({ name: 'euphoria_code_id' })
    euphoria_code_id: number | undefined;

    @Column({ name: 'mainnet_code_id' })
    mainnet_code_id: number | undefined;

    @Column({ name: 'contract_hash' })
    contract_hash: string | undefined;

    @Column({ name: 'url' })
    url: string | undefined;

    @Column({
        name: 'instantiate_msg_schema',
        type: 'text',
    })
    instantiate_msg_schema: string | undefined;

    @Column({
        name: 'query_msg_schema',
        type: 'text',
    })
    query_msg_schema: string | undefined;

    @Column({
        name: 'execute_msg_schema',
        type: 'text',
    })
    execute_msg_schema: string | undefined;

    @Column({ name: 'compiler_version' })
    compiler_version: string | undefined;

    @Column({ name: 's3_location' })
    s3_location: string | undefined;

    @Column({ name: 'status' })
    status: string | undefined;

    @Column({ name: 'reason' })
    reason: string | undefined;
}