import { SmartContracts } from "entities";

export interface ContractDeploymentRequest {
    code_id: number;
}

export interface HandleDeploymentRequest {
    smart_contract: SmartContracts;
}