import { Post, Service } from "@ourparentcenter/moleculer-decorators-extended";
import { Config } from "../../common";
import { Context } from "moleculer";
import { AppConstants, ErrorCode, ErrorMessage, LoginRequest, MoleculerDBService, ResponseDto } from "../../types";
import { FirebaseAuthProvider } from "../../utils";

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
@Service({
    name: 'auth',
    version: 1,
    /**
     * Mixins
     */
    mixins: [],
    /**
     * Settings
     */
})
export default class AuthService extends MoleculerDBService<
{
    rest: 'v1/auth';
},
{}
> {
    /**
     *  @swagger
     *
     *  /api/v1/auth/login:
     *    post:
     *      tags:
     *        - "Auth"
     *      summary: Approver login into application
     *      description: Approver login into application
     *      requestBody:
     *        content:
	 *          application/json:
     *            schema:
     *              type: object
     *              required:
     *              - email
     *              - password
     *              properties:
     *                email:
     *                  type: string
     *                  description: "Approver account email"
     *                password:
     *                  type: string
     *                  description: "Approver account password"
     *      responses:
     *        200:
     *          description: Login result
     *        422:
     *          description: Missing parameters
     */
    @Post('/login', {
        name: 'login',
        /**
         * Service guard services allowed to connect
         */
        restricted: ['api'],
        params: {
            email: 'string',
            password: 'string',
        },
    })
    async login(ctx: Context<LoginRequest>) {
        let { email, password } = ctx.params;
        let approverEmails = Config.APPROVER_EMAILS;
		approverEmails = approverEmails.split(',');
        if (!approverEmails.includes(email)) {
            const response: ResponseDto = {
                code: ErrorCode.INVALID_EMAIL,
                message: ErrorMessage.INVALID_EMAIL,
                data: ctx.params,
            };
            return response;
        }
        let firebaseAuthProvider = new FirebaseAuthProvider();
        try {
            const result = await firebaseAuthProvider.signin(email, password);
            const response: ResponseDto = {
                code: ErrorCode.SUCCESSFUL,
                message: ErrorMessage.LOGIN_SUCCESSFUL,
                data: result,
            };
            return response;
        } catch (error: any) {
            this.logger.error(`${error.name}: ${error.message}`);
            this.logger.error(`${error}`);
            if (error.code === AppConstants.NOT_AUTHORIZED_EXEPTION) {
                const response: ResponseDto = {
                    code: ErrorCode.INVALID_PASSWORD,
                    message: ErrorMessage.INVALID_PASSWORD,
                    data: ctx.params,
                };
                return response;
            } else if (error.message === AppConstants.NEW_PASS_REQUIRED) {
                const response: ResponseDto = {
                    code: ErrorCode.NEW_PASS_REQUIRED,
                    message: ErrorMessage.NEW_PASS_REQUIRED,
                    data: ctx.params,
                };
                return response;
            } else {
                const response: ResponseDto = {
                    code: ErrorCode.INVALID_CREDENTIALS,
                    message: ErrorMessage.INVALID_CREDENTIALS,
                    data: ctx.params,
                };
                return response;
            }

        }
    }
}