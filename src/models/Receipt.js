import { sequelize } from '../database/database.js';
import { DataTypes } from 'sequelize';
import { PurchaseOrderItem } from './PurchaseOrderItem.js';

export const Receipt = sequelize.define(
	'receipts',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		purchase_order_item_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		purchase_order_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		receipt_date: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		doc_type: {
			type: DataTypes.ENUM(
				'Factura',
				'Guía de despacho',
				'Boleta de honorarios',
				'Vale',
				'Estado de pago',
			),
			allowNull: false,
		},
		doc_number: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM(
				'Recepción sin factura',
				'Recepción con factura',
				'Anulada',
			),
			allowNull: false,
			defaultValue: 'Recepción sin factura',
		},
		invoice_number: {
			type: DataTypes.STRING,
		},
		received_quantity: {
			type: DataTypes.INTEGER,
		},
		received_amount: {
			type: DataTypes.DECIMAL,
		},
		iva: {
			type: DataTypes.DECIMAL,
		},
		total: {
			type: DataTypes.DECIMAL,
		},
	},
	{
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	},
);

Receipt.beforeCreate((instance, options) => {
	instance.status =
		instance.doc_type === 'Factura'
			? 'Recepción con factura'
			: 'Recepción sin factura';
	instance.invoice_number =
		instance.doc_type === 'Factura' ? instance.doc_number : null;
});

Receipt.belongsTo(PurchaseOrderItem, {
	foreignKey: 'purchase_order_item_id',
	as: 'item',
	targetKey: 'id',
});
