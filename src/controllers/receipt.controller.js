import { Op } from 'sequelize';
import { sequelize } from '../database/database.js';
import { GeneralItem } from '../models/GeneralItem.js';
import { ItemReceipt } from '../models/ItemReceipt.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { PurchaseOrderItem } from '../models/PurchaseOrderItem.js';
import { Receipt } from '../models/Receipt.js';

export const getReceiptsByPurchaseOrder = async (req, res) => {
	try {
		const { poId } = req.params;
		const receipts = await ItemReceipt.findAll({
			where: { purchase_order_id: poId },
			include: [
				{
					model: PurchaseOrderItem,
					as: 'item',
					attributes: ['general_item_id'],
					include: [
						{
							model: GeneralItem,
							attributes: ['name', 'sku'],
						},
					],
					order: [['created_at', 'ASC']],
					required: false,
				},
			],
			order: [['created_at', 'DESC']],
		});
		if (receipts?.length > 0) {
			const formattedReceipts = receipts.map(receipt => ({
				...receipt.toJSON(),
				general_item_id: receipt.item?.general_item_id || null,
				item_name: receipt.item?.general_item?.name || null,
				item_sku: receipt.item?.general_item?.sku || null,
				item: undefined,
			}));
			return res.status(200).json(formattedReceipts);
		}

		return res.status(204).send();
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};

export const addInvoice = async (req, res) => {
	try {
		const { id } = req.params;
		const { invoice_number } = req.body;

		const itemReceipt = await ItemReceipt.update(
			{ invoice_number, status: 'Recepción con factura' },
			{ where: { id } },
		);
		if (itemReceipt?.length === 1) {
			return res.status(200).json({ message: 'Factura agregada exitosamente' });
		}

		return res
			.status(404)
			.json({ message: 'Ocurrió un error al intentar agregar la factura' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};

export const cancelReceipt = async (req, res) => {
	try {
		const transaction = await sequelize.transaction();
		const { id } = req.params;

		const itemReceipt = await ItemReceipt.findByPk(id);
		if (!itemReceipt)
			throw new Error(`No se encontró la recepcion de item con id ${id}`);

		const purchaseOrderItem = await PurchaseOrderItem.findByPk(
			itemReceipt.purchase_order_item_id,
		);
		if (!purchaseOrderItem)
			throw new Error(
				`No se encontró el item con id ${itemReceipt.purchase_order_item_id}`,
			);

		const receipt = await Receipt.findByPk(itemReceipt.receipt_id);
		if (!receipt)
			throw new Error(
				`No se encontró la recepcion con id ${itemReceipt.receipt_id}`,
			);

		const purchaseOrder = await PurchaseOrder.findByPk(
			itemReceipt.purchase_order_id,
		);
		if (!purchaseOrder)
			throw new Error(
				`No se encontró la OC con id ${itemReceipt.purchase_order_id}`,
			);

		// item_receipt updates
		await itemReceipt.update(
			{
				status: 'Anulada',
			},
			{ where: { id }, transaction },
		);

		// purchase_order_item updates
		const newItemReceivedQuantity =
			parseInt(purchaseOrderItem.total_received_quantity) -
			parseInt(itemReceipt.received_quantity);

		const newItemReceivedAmount =
			parseFloat(purchaseOrderItem.total_received_amount) -
			parseFloat(itemReceipt.received_amount);

		const newQuantityToReceive =
			parseInt(purchaseOrderItem.quantity_to_receive) +
			parseInt(itemReceipt.received_quantity);

		const newAmountToReceive =
			parseFloat(purchaseOrderItem.amount_to_receive) +
			parseFloat(itemReceipt.received_amount);

		await purchaseOrderItem.update(
			{
				total_received_quantity: newItemReceivedQuantity,
				total_received_amount: newItemReceivedAmount,
				quantity_to_receive: newQuantityToReceive,
				amount_to_receive: newAmountToReceive,
			},
			{ transaction },
		);

		// receipt updates
		const newReceivedAmount =
			parseFloat(receipt.received_amount) -
			parseFloat(itemReceipt.received_amount);
		await receipt.update({ received_amount: newReceivedAmount });

		// purchase_order updates
		const itemReceipts = await ItemReceipt.findAll({
			where: {
				receipt_id: itemReceipt.receipt_id,
				status: {
					[Op.ne]: 'Anulada',
				},
			},
		});
		const isLastItemReceipt = itemReceipts?.length === 1;
		console.log({ isLastItemReceipt });
		const receiptDiscount = isLastItemReceipt
			? parseFloat(receipt.receipt_discount)
			: 0;
		console.log({ receiptDiscount });

		const newTotalReceiptDiscount =
			parseFloat(purchaseOrder.total_receipt_discount) - receiptDiscount;

		const newTotalReceivedAmount =
			parseFloat(purchaseOrder.total_received_amount) -
			(parseFloat(itemReceipt.received_amount) - receiptDiscount);

		await purchaseOrder.update(
			{
				total_receipt_discount: newTotalReceiptDiscount,
				total_received_amount: newTotalReceivedAmount,
			},
			{ transaction },
		);

		await transaction.commit();

		return res.status(200).json({ message: 'Recepción anulada exitosamente' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};
