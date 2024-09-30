import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const { EMAIL_USER, EMAIL_PASSWORD, NODE_ENV } = env;

export const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: EMAIL_USER,
		pass: EMAIL_PASSWORD,
	},
	tls: {
		rejectUnauthorized: NODE_ENV === 'production',
	},
});
