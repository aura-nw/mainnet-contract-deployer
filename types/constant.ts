export enum TransactionMessage {
    MSG_STORE_CODE = '/cosmwasm.wasm.v1.MsgStoreCode',
    MSG_INSTANTIATE_CONTRACT = '/cosmwasm.wasm.v1.MsgInstantiateContract',
}

export enum AppConstants {
    DEFAULT_GAS_PRICE = '0.0002utaura',
    AUTO = 'auto',
    DEFAULT_AMOUNT_FUND = 233444,
    DEFAULT_DENOM_FUND = 'utaura',
    DEFAULT_DENOM = 'utaura',
    INSUFFICIENT_FUNDS = 'insufficient funds',
    ALREADY_SOLD = 'already sold',
    MAX_TOKENS_PER_BATCH_MINT = 20,
  }