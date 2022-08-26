export enum TransactionMessage {
    MSG_STORE_CODE = '/cosmwasm.wasm.v1.MsgStoreCode',
    MSG_INSTANTIATE_CONTRACT = '/cosmwasm.wasm.v1.MsgInstantiateContract',
}

export enum AppConstants {
    DEFAULT_GAS_PRICE = '0.002utaura',
    AUTO = 'auto',
    DEFAULT_AMOUNT_FUND = 233444,
    DEFAULT_DENOM_FUND = 'utaura',
    DEFAULT_DENOM = 'utaura',
    INSUFFICIENT_FUNDS = 'insufficient funds',
    ALREADY_SOLD = 'already sold',
    MAX_TOKENS_PER_BATCH_MINT = 20,
}

export enum MainnetUploadStatus {
    SUCCESS = 'Successful',
    REJECTED = 'Rejected',
    PENDING = 'Pending',
}

export enum ContractVerification {
    EXACT_MATCH = 'EXACT MATCH',
    SIMILAR_MATCH = 'SIMILAR MATCH',
    UNVERIFIED = 'UNVERIFIED',
}

export enum AppConstants {
    NOT_AUTHORIZED_EXEPTION = 'NotAuthorizedException',
    NEW_PASS_REQUIRED = 'callback.newPasswordRequired is not a function',
}