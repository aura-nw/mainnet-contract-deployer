import { DeploymentRequests, SmartContracts } from "entities";

export interface RequestDeploymentParams {
    code_ids: number[];
    requester_address: string;
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
    wechat: string;
    linkedin: string;
    discord: string;
    medium: string;
    reddit: string;
    slack: string;
    facebook: string;
    twitter: string;
    bitcointalk: string;
}

export interface DeploymentRequest {
    request_id: number;
}

export interface DeploymentParams {
    code_ids: number[];
}

export interface ContractDeploymentRequest {
    code_id: number;
}

export interface HandleRequestParams {
    code_id: number;
    requester_address: string;
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
    wechat: string;
    linkedin: string;
    discord: string;
    medium: string;
    reddit: string;
    slack: string;
    facebook: string;
    twitter: string;
    bitcointalk: string;
    contract_hash: string;
    url: string;
    instantiate_msg_schema: string;
    query_msg_schema: string;
    execute_msg_schema: string;
    compiler_version: string;
    s3_location: string;
    request_id: number;
}

export interface UpdateContractStatusRequest {
    euphoria_code_id: number;
    mainnet_code_id: number;
}

export interface RejectDeploymentRequest {
    request_id: number;
    reason: string;
}

export interface RejectDeploymentParams {
    code_ids: number[];
    reason: string;
}

export interface GetRequestsParams {
    request_id: number;
}

export interface ListRequestsParams {
    status: string;
    requester_address: string;
    limit: number;
    offset: number;
}