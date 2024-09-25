import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import { GeneralItem } from './GeneralItem.js';
import { AccountCost } from './AccountCost.js';

export const PurchaseOrderItem = sequelize.define(
	'purchase_order_items',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		general_item_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		description: {
			type: DataTypes.STRING,
		},
		measurement_unit: {
			type: DataTypes.STRING,
		},
		unit_price: {
			type: DataTypes.DECIMAL,
		},
		quantity: {
			type: DataTypes.INTEGER,
		},
		subtotal: {
			type: DataTypes.DECIMAL,
		},
		total_received_quantity: {
			type: DataTypes.DECIMAL,
			defaultValue: 0,
		},
		total_received_amount: {
			type: DataTypes.DECIMAL,
			defaultValue: 0,
		},
		quantity_to_receive: {
			type: DataTypes.INTEGER,
		},
		amount_to_receive: {
			type: DataTypes.DECIMAL,
		},
		receipt_status: {
			type: DataTypes.ENUM(
				'Sin recepción',
				'Recepción parcial',
				'Recepción completa',
			),
			allowNull: false,
			defaultValue: 'Sin recepción',
		},
		purchase_order_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	},
);

PurchaseOrderItem.beforeCreate((instance, options) => {
	instance.quantity_to_receive = instance.quantity || 0;
	instance.amount_to_receive = instance.subtotal || 0;
});

PurchaseOrderItem.belongsTo(GeneralItem, {
	foreignKey: 'general_item_id',
	targetkey: 'id',
});

PurchaseOrderItem.belongsTo(AccountCost, {
	foreignKey: 'account_costs_id',
	targetkey: 'id',
});
