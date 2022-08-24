import { SmartContracts } from "entities";

export interface RequestDeploymentParams {
    code_ids: number[];
    name: string;
    email: string;
    contract_description: string;
    project_name: string;
    official_project_website: string;
    official_project_email: string;
    project_sector: string;
    whitepaper: string;
    github: string;
    telegram: string;
    discord: string;
    facebook: string;
    twitter: string;
}

export interface DeploymentRequest {
    code_ids: number[];
}

export interface ContractDeploymentRequest {
    code_id: number;
}

export interface HandleDeploymentRequest {
    smart_contract: SmartContracts;
}

export interface HandleRequestParams {
    code_id: number;
    name: string;
    email: string;
    contract_description: string;
    project_name: string;
    official_project_website: string;
    official_project_email: string;
    project_sector: string;
    whitepaper: string;
    github: string;
    telegram: string;
    discord: string;
    facebook: string;
    twitter: string;
    contract_hash: string;
    url: string;
    instantiate_msg_schema: string;
    query_msg_schema: string;
    execute_msg_schema: string;
    compiler_version: string;
    request_id: number;
}

export interface UpdateContractStatusRequest {
    euphoria_code_id: number;
    mainnet_code_id: number;
}

export interface RejectDeploymentParams {
    code_ids: number[];
    reason: string;
}