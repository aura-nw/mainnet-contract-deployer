import { constants } from 'http2';

// eslint-disable-next-line no-shadow, @typescript-eslint/naming-convention
export enum ErrorMessage {
	SUCCESSFUL = 'Successful',
	NOT_FOUND = 'user.notfound',
	WRONG = 'user.wrong',
	NOT_ACTIVE = 'user.notactive',
	DUPLICATED_LOGIN = 'user.duplicated.login',
	DUPLICATED_EMAIL = 'user.duplicated.email',
	DELETE_ITSELF = 'user.delete.itself',
	CONTRACT_NOT_FOUND = 'This contract(s) does not exist or is not verified',
	INSUFFICIENT_FUNDS = 'Insufficient funds',
	SIMULATE_TX_FAIL = 'Simulate transaction failed',
	REQUEST_SUCCESSFUL = 'Contract(s) deployment request successful',
	UPDATE_REQUEST_SUCCESSFUL = 'Request info update successful',
	INVALID_EMAIL = 'Invalid email',
	INVALID_PASSWORD = 'Invalid password',
	INVALID_CREDENTIALS = 'Invalid email or password, please try again',
	NEW_PASS_REQUIRED = 'User must change password in first login time',
	LOGIN_SUCCESSFUL = 'Login successful',
	CONTRACT_ALREADY_UPLOADED = 'Contract(s) already uploaded on Mainnet',
	CONTRACT_ALREADY_REQUESTED = 'Contract(s) already being requested to upload',
	REQUEST_NOT_FOUND = 'Request not found',
	REQUEST_NOT_PENDING = 'This request is not pending',
	WRONG_CREATOR = 'You are not the creator of this contract',
}

export const ErrorCode = {
	SUCCESSFUL: constants.HTTP_STATUS_OK,
	NOT_FOUND: constants.HTTP_STATUS_NOT_FOUND,
	WRONG: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	NOT_ACTIVE: constants.HTTP_STATUS_FORBIDDEN,
	DUPLICATED_LOGIN: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DUPLICATED_EMAIL: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	DELETE_ITSELF: constants.HTTP_STATUS_UNPROCESSABLE_ENTITY,
	CONTRACT_NOT_FOUND: 'E001',
	INSUFFICIENT_FUNDS: 'E002',
	SIMULATE_TX_FAIL: 'E003',
	INVALID_EMAIL: 'E004',
	INVALID_PASSWORD: 'E005',
	NEW_PASS_REQUIRED: 'E006',
	INVALID_CREDENTIALS: 'E007',
	CONTRACT_ALREADY_UPLOADED: 'E008',
	CONTRACT_ALREADY_REQUESTED: 'E009',
	REQUEST_NOT_FOUND: 'E010',
	REQUEST_NOT_PENDING: 'E011',
	WRONG_CREATOR: 'E012',
};
