import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { User } from './User.js';

export const Company = sequelize.define(
	'companies',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		rut: {
			type: DataTypes.STRING,
		},
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		business_name: {
			type: DataTypes.STRING,
		},
		image_url: {
			type: DataTypes.STRING,
		},
		is_active: {
			type: DataTypes.BOOLEAN,
		},
		user_create: {
			type: DataTypes.INTEGER,
		},
		user_update: {
			type: DataTypes.INTEGER,
		},
		id_state: {
			type: DataTypes.INTEGER,
		},
		location: {
			type: DataTypes.JSONB,
		},
		id_contractual_state: {
			type: DataTypes.INTEGER,
		},
		start_of_periods: {
			type: DataTypes.STRING,
		},
		end_of_periods: {
			type: DataTypes.STRING,
		},
	},
	{
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	},
);

Company.belongsTo(User, {
	foreignKey: 'user_create',
	as: 'createdBy',
	targetKey: 'id',
});

Company.belongsTo(User, {
	foreignKey: 'user_update',
	as: 'updatedBy',
	targetKey: 'id',
});
