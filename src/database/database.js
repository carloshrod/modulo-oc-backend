import Sequelize from 'sequelize';
import { env } from '../config/env.js';

const { DB_NAME, DB_HOST, DB_PASSWORD, DB_USER } = env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
	host: DB_HOST,
	dialect: 'postgres',
});
