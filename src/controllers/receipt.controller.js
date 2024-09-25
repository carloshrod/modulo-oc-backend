import { GeneralItem } from '../models/GeneralItem.js';
import { PurchaseOrderItem } from '../models/PurchaseOrderItem.js';
import { Receipt } from '../models/Receipt.js';

export const getReceiptsByPurchaseOrder = async (req, res) => {
	try {
		const { poId } = req.params;
		const receipts = await Receipt.findAll({
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

		const receipt = await Receipt.update(
			{ invoice_number, status: 'Recepción con factura' },
			{ where: { id } },
		);
		console.log(receipt);
		console.log(receipt?.length);

		return res.status(200).json({ message: 'Factura agregada con éxito' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};
