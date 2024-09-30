import { config } from 'dotenv';
config();

export const env = {
	DB_NAME: process.env.DB_NAME,
	DB_USER: process.env.DB_USER,
	DB_PASSWORD: process.env.DB_PASSWORD,
	DB_HOST: process.env.DB_HOST,
	EMAIL_USER: process.env.EMAIL_USER,
	EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
	CLIENT_HOST: process.env.CLIENT_HOST,
	NODE_ENV: process.env.NODE_ENV,
};
