import {  Service, ServiceSchema } from 'moleculer';
import { Config } from '../../common';
const nodemailer = require("nodemailer");

export default class NodemailerMixin implements Partial<ServiceSchema>, ThisType<Service> {
	private schema: Partial<ServiceSchema> & ThisType<Service>;

	public constructor() {
		this.schema = {
			methods: {
				async getTransport() {
					if (this.transporter === undefined) {
						this.transporter = nodemailer.createTransport({
                            host: Config.AURA_HOST,
                            port: Config.AURA_PORT,
                            secureConnection: false,
                            tls: {
                                ciphers: 'SSLv3',
                            },
                            auth: {
                                user: Config.EMAIL_USER,
                                pass: Config.EMAIL_PASSWORD,
                            }
                        });
					}
					return this.transporter;
				},
			},
		};
	}

	public start() {
		return this.schema;
	}
}

export const nodemailerMixin = new NodemailerMixin().start();
