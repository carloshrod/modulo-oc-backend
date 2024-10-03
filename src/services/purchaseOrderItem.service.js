import { PurchaseOrderItem } from '../models/PurchaseOrderItem.js';

export const createNewItems = async (items, purchaseOrderId, transaction) => {
	try {
		const itemIds = [];

		await Promise.all(
			items.map(async item => {
				const newItem = await PurchaseOrderItem.create(
					{
						...item,
						purchase_order_id: purchaseOrderId,
						subtotal: item.subtotal === 0 ? undefined : item.subtotal,
					},
					{ transaction },
				);
				itemIds.push(newItem.id);
			}),
		);

		return itemIds;
	} catch (error) {
		console.error(error);
		throw new Error('Error al crear los artículos de la orden de compra');
	}
};

export const updateItems = async (validItems, purchaseOrderId, transaction) => {
	try {
		const itemIds = [];

		for (const item of validItems) {
			if (item?.id) {
				await PurchaseOrderItem.update(
					{ ...item },
					{ where: { id: item.id }, transaction },
				);
				itemIds.push(item.id);
			} else {
				const newItem = await PurchaseOrderItem.create(
					{
						...item,
						purchase_order_id: purchaseOrderId,
					},
					{ transaction },
				);
				itemIds.push(newItem.id);
			}
		}

		return itemIds;
	} catch (error) {
		console.error(error);
		throw new Error('Error al actualizar los artículos de la orden de compra');
	}
};
