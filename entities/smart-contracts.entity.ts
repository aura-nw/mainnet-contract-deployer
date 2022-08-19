import { Column, Entity } from "typeorm";
import { BaseEntityIncrementId } from "./base/base.entity";

@Entity('smart_contracts')
export class SmartContracts extends BaseEntityIncrementId {
    @Column({ name: 'height' })
    height: number | undefined;

    @Column({ name: 'code_id' })
    code_id: number | undefined;

    @Column({ name: 'contract_name' })
    contract_name: string | undefined;

    @Column({ name: 'contract_address' })
    contract_address: string | undefined;

    @Column({ name: 'creator_address' })
    creator_address: string | undefined;

    @Column({ name: 'contract_hash' })
    contract_hash: string | undefined;

    @Column({ name: 'tx_hash' })
    tx_hash: string | undefined;

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

    @Column({ name: 'contract_match' })
    contract_match: string | undefined;

    @Column({ name: 'contract_verification' })
    contract_verification: string | undefined;

    @Column({ name: 'compiler_version' })
    compiler_version: string | undefined;

    @Column({ name: 's3_location' })
    s3_location: string | undefined;

    @Column({ name: 'mainnet_code_id' })
    mainnet_code_id: string | undefined;

    @Column({ name: 'mainnet_upload_status' })
    mainnet_upload_status: string | undefined;
}