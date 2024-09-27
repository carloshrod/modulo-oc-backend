import { sequelize } from '../database/database.js';
import { DataTypes } from 'sequelize';
import { PurchaseOrder } from './PurchaseOrder.js';
import { ItemReceipt } from './ItemReceipt.js';

export const Receipt = sequelize.define(
	'receipts',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		purchase_order_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		receipt_discount: {
			type: DataTypes.DECIMAL,
			defaultValue: 0,
		},
		received_amount: {
			type: DataTypes.DECIMAL,
			allowNull: false,
			defaultValue: 0,
		},
	},
	{
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	},
);

Receipt.beforeCreate((instance, options) => {
	if (instance.receipt_discount < 0) {
		instance.receipt_discount = Math.abs(instance.receipt_discount);
	}
});

Receipt.beforeUpdate((instance, options) => {
	if (instance.receipt_discount < 0) {
		instance.receipt_discount = Math.abs(instance.receipt_discount);
	}
});

Receipt.hasMany(ItemReceipt, {
	foreignKey: 'receipt_id',
	as: 'itemReceipts',
	sourceKey: 'id',
	onDelete: 'CASCADE',
});

PurchaseOrder.hasMany(Receipt, {
	foreignKey: 'purchase_order_id',
	as: 'receipts',
	sourceKey: 'id',
	onDelete: 'CASCADE',
});
