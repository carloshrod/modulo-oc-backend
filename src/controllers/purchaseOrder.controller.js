import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { PurchaseOrderItem } from '../models/PurchaseOrderItem.js';
import {
	buildPurchaseOrderByNumberInclude,
	buildPurchaseOrdersIncludes,
	generatePurchaseOrderNumber,
	getPurchaseOrderWithSupplierInfo,
	processPurchaseOrderResult,
	sendPurchaseOrderForApprovalService,
} from '../services/purchaseOrder.service.js';
import { getApproversOrderedByRole } from '../services/approver.service.js';
import { ApprovalEvent } from '../models/ApprovalEvent.js';
import { User } from '../models/User.js';
import { sequelize } from '../database/database.js';
import { validatePoItems } from '../utils/validatePoItems.js';
import { transporter } from '../utils/nodemailer.js';
import { rejectPoOptions } from '../utils/emailOptions.js';
import { ItemReceipt } from '../models/ItemReceipt.js';
import { Receipt } from '../models/Receipt.js';
import { Oeuvre } from '../models/Oeuvre.js';
import {
	createNewItems,
	updateItems,
} from '../services/purchaseOrderItem.service.js';
import {
	generateUpdatedAttachments,
	uploadFiles,
} from '../services/file.service.js';

export const savePurchaseOrder = async (req, res) => {
	const transaction = await sequelize.transaction();
	try {
		const { oeuvre_id, items, status, submittedBy, ...rest } = req.body;
		const { files } = req?.files ?? {};

		const newOrderNumber = await generatePurchaseOrderNumber(oeuvre_id);

		const attachments = await uploadFiles(files);

		const newPurchaseOrder = await PurchaseOrder.create(
			{
				...rest,
				number: newOrderNumber,
				oeuvre_id,
				approval_date: null,
				reception_date: null,
				user_create: submittedBy,
				status,
				attachments,
			},
			{ transaction },
		);

		let itemIds = [];
		if (items?.length > 0) {
			const validItems = validatePoItems(items);

			if (validItems?.length > 0) {
				itemIds = await createNewItems(
					items,
					newPurchaseOrder?.id,
					transaction,
				);
			}
		}

		if (itemIds?.length > 0 && status === 'En revisión') {
			const response = await sendPurchaseOrderForApprovalService(
				newPurchaseOrder,
				submittedBy,
				transaction,
			);

			await transaction.commit();

			return res.status(200).json({
				message: response.message,
				purchaseOrder: {
					...newPurchaseOrder.dataValues,
					items: itemIds,
				},
			});
		}

		await transaction.commit();

		return res.status(200).json({
			message: 'Orden de compra guardada como borrador!',
			purchaseOrder: {
				...newPurchaseOrder.dataValues,
				items: itemIds,
			},
		});
	} catch (error) {
		await transaction.rollback();
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};

export const updatePurchaseOrder = async (req, res) => {
	const transaction = await sequelize.transaction();
	try {
		const { id } = req.params;
		const { items, submittedBy, filesToKeep, ...rest } = req.body;
		const { files } = req?.files ?? {};

		const purchaseOrder = await PurchaseOrder.findByPk(id);
		if (!purchaseOrder) {
			return res.status(404).json({ message: 'Orden de compra no encontrada' });
		}

		const updatedAttachments = await generateUpdatedAttachments(
			files,
			purchaseOrder,
			filesToKeep,
		);

		await purchaseOrder.update(
			{
				...rest,
				user_update: submittedBy,
				attachments: updatedAttachments,
			},
			{ transaction },
		);

		const existingItems = await PurchaseOrderItem.findAll({
			where: { purchase_order_id: id },
		});

		let itemIds = [];
		if (items?.length > 0) {
			const validItems = validatePoItems(items);

			if (validItems?.length > 0) {
				itemIds = await updateItems(validItems, purchaseOrder?.id, transaction);
			}
		} else {
			if (existingItems?.length > 0) {
				for (const existingItem of existingItems) {
					await existingItem.destroy();
				}
			}
		}

		if (itemIds?.length > 0 && existingItems?.length > 0) {
			for (const existingItem of existingItems) {
				if (!itemIds.includes(existingItem.id)) {
					await existingItem.destroy();
				}
			}
		}

		if (itemIds?.length > 0 && purchaseOrder.status === 'En revisión') {
			const response = await sendPurchaseOrderForApprovalService(
				purchaseOrder,
				submittedBy,
				transaction,
			);

			await transaction.commit();

			return res.status(200).json({
				message: response.message,
				purchaseOrder: {
					...purchaseOrder.dataValues,
					items: itemIds,
				},
			});
		}

		await transaction.commit();

		return res.status(200).json({
			message: 'Orden de compra guardada como borrador!',
			purchaseOrder: {
				...purchaseOrder.dataValues,
				items: itemIds,
			},
		});
	} catch (error) {
		await transaction.rollback();
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};

export const sendPurchaseOrderForApproval = async (req, res) => {
	const transaction = await sequelize.transaction();
	try {
		const { id } = req.params;
		const { submittedBy } = req.body;

		const purchaseOrder = await getPurchaseOrderWithSupplierInfo(id);
		if (!purchaseOrder) {
			return res.status(404).json({ message: 'Orden de compra no encontrada' });
		}

		const response = await sendPurchaseOrderForApprovalService(
			purchaseOrder,
			submittedBy,
			transaction,
		);

		await transaction.commit();

		return res.status(200).json({
			message: response.message,
			purchaseOrder,
		});
	} catch (error) {
		await transaction.rollback();
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};

export const getPurchaseOrdersByOeuvre = async (req, res) => {
	try {
		const { oeuvreId } = req.params;
		const includeItems = req.query.includeItems === 'true';
		const includeItemReceipts = req.query.includeItemReceipts === 'true';

		const includes = buildPurchaseOrdersIncludes(
			includeItems,
			includeItemReceipts,
		);

		const purchaseOrders = await PurchaseOrder.findAll({
			where: { oeuvre_id: oeuvreId },
			attributes: {
				include: [
					[sequelize.col('supplier.supplier_rut'), 'supplier_rut'],
					[sequelize.col('supplier.supplier_name'), 'supplier_name'],
				],
			},
			include: includes,
			order: [['created_at', 'DESC']],
		});

		if (purchaseOrders?.length > 0) {
			return res.status(200).json(purchaseOrders);
		}

		return res.status(204).send();
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};

export const getPurchaseOrderByNumber = async (req, res) => {
	try {
		const { oeuvreId, poNumber } = req.params;
		const includeEvents = req.query.includeEvents === 'true';

		const purchaseOrder = await PurchaseOrder.findOne({
			where: { oeuvre_id: oeuvreId, number: poNumber.replace('oc', 'OC') },
			attributes: [
				'id',
				'oeuvre_id',
				'number',
				'name',
				'gloss',
				'supplier_id',
				[sequelize.col('supplier.supplier_rut'), 'supplier_rut'],
				[sequelize.col('supplier.supplier_name'), 'supplier_name'],
				'delivery_date',
				'delivery_address',
				'currency_type',
				'exchange_rate',
				'discount',
				'total_receipt_discount',
				'net_total',
				'iva',
				'total',
				'status',
				'total_received_amount',
				'created_at',
				'approval_date',
				'attachments',
			],
			include: buildPurchaseOrderByNumberInclude(),
		});

		const result = await processPurchaseOrderResult(
			purchaseOrder,
			includeEvents,
		);

		return res.status(200).json(result);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};

export const rejectPurchaseOrder = async (req, res) => {
	const transaction = await sequelize.transaction();
	try {
		const { id } = req.params;
		const { rejectedBy, comments } = req.body;

		const purchaseOrder = await getPurchaseOrderWithSupplierInfo(id);
		const approvers = await getApproversOrderedByRole(purchaseOrder.oeuvre_id);

		let currentUserResponsible;
		if (approvers?.length > 0) {
			const currentApproverIndex = approvers.findIndex(
				approver => approver.user_id === rejectedBy,
			);
			currentUserResponsible = approvers[currentApproverIndex - 1] || null;
		}

		let mailTo = {
			email: currentUserResponsible?.user?.email,
			full_name: currentUserResponsible?.user?.full_name,
		};
		if (!currentUserResponsible) {
			const userCreate = await User.findByPk(purchaseOrder.user_create, {
				attributes: ['email', 'full_name'],
			});

			mailTo = { email: userCreate.email, full_name: userCreate.full_name };
		}

		if (mailTo) {
			await purchaseOrder.update(
				{
					user_update: rejectedBy,
					status: 'Rechazada',
					current_approver_id: currentUserResponsible?.id || null,
				},
				{ transaction },
			);

			await ApprovalEvent.create(
				{
					author: rejectedBy,
					status: 'Rechazada',
					purchase_order_id: purchaseOrder.id,
					comments,
				},
				{ transaction },
			);

			const oeuvre = await Oeuvre.findByPk(purchaseOrder.oeuvre_id, {
				attributes: ['id', 'oeuvre_name'],
			});
			if (!oeuvre) {
				throw new Error('Oeuvre not found');
			}

			const data = {
				mailTo,
				poNumber: purchaseOrder?.number,
				oeuvreName: oeuvre?.oeuvre_name,
				comments,
			};

			transporter.sendMail(rejectPoOptions(data), (error, info) => {
				if (error) {
					console.log(error);
				} else {
					console.log('Correo enviado: ' + info.response);
				}
			});

			await transaction.commit();

			return res.status(200).json({
				purchaseOrder,
				message: `Orden de compra rechazada exitosamente`,
			});
		}

		return res.status(400).json({
			message: `Ocurrió un error al intentar rechazar la orden de compra`,
		});
	} catch (error) {
		await transaction.rollback();
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};

export const cancelPurchaseOrder = async (req, res) => {
	try {
		const { id } = req.params;
		const { canceledBy } = req.body;

		const purchaseOrder = await PurchaseOrder.findByPk(id);
		if (!purchaseOrder) {
			return res.status(404).json({ message: 'Orden de compra no encontrada' });
		}

		const newStatus =
			purchaseOrder.status === 'Borrador' ? 'Cancelada' : 'Cerrada';

		await purchaseOrder.update({ user_update: canceledBy, status: newStatus });

		return res.status(200).json({
			newStatus,
			message: `Orden de compra ${newStatus?.toLocaleLowerCase()} exitosamente`,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};

export const receivePurchaseOrder = async (req, res) => {
	const transaction = await sequelize.transaction();
	try {
		const { items, discount, net_total, ...rest } = req.body;

		if (items?.length > 0) {
			const purchaseOrderId = items[0].purchase_order_id;

			const receipt = await Receipt.create(
				{
					purchase_order_id: purchaseOrderId,
					receipt_discount: discount || 0,
					received_amount: net_total,
				},
				{ transaction },
			);
			if (!receipt) {
				throw new Error(
					`Error al crear la recepción para la OC con id ${purchaseOrderId}`,
				);
			}

			for (const item of items) {
				if (item.received_quantity > 0 && item.received_amount > 0) {
					const existingItem = await PurchaseOrderItem.findOne({
						where: { id: item.id },
					});

					if (existingItem) {
						const {
							quantity,
							subtotal,
							total_received_quantity,
							total_received_amount,
						} = existingItem;

						const newTotalReceivedQuantity =
							parseInt(total_received_quantity) +
							parseInt(item.received_quantity);

						const newTotalReceivedAmount =
							parseFloat(total_received_amount) +
							parseFloat(item.received_amount);
						let newReceiptStatus;

						const newQuantityToReceive =
							parseInt(quantity) - parseInt(newTotalReceivedQuantity);
						const newAmountToReceive =
							parseFloat(subtotal) - parseFloat(newTotalReceivedAmount);

						if (newTotalReceivedAmount === 0) {
							newReceiptStatus = 'Sin recepción';
						} else if (newQuantityToReceive > 0 && newAmountToReceive > 0) {
							newReceiptStatus = 'Recepción parcial';
						} else if (newQuantityToReceive === 0 && newAmountToReceive === 0) {
							newReceiptStatus = 'Recepción completa';
						}

						await PurchaseOrderItem.update(
							{
								total_received_quantity: newTotalReceivedQuantity,
								total_received_amount: newTotalReceivedAmount,
								receipt_status: newReceiptStatus,
								quantity_to_receive: newQuantityToReceive,
								amount_to_receive: newAmountToReceive,
							},
							{
								where: { id: item.id },
								transaction,
							},
						);

						const iva = parseFloat(item.received_amount) * 0.19;
						const total = parseFloat(item.received_amount) + iva;

						await ItemReceipt.create(
							{
								...rest,
								purchase_order_item_id: item.id,
								purchase_order_id: purchaseOrderId,
								receipt_id: receipt.id,
								received_quantity: parseFloat(item.received_quantity),
								received_amount: parseFloat(item.received_amount),
								iva,
								total,
							},
							{ transaction },
						);
					} else {
						return res.status(400).json({
							message: `No se encontró el item ${item.id} en la base de datos`,
						});
					}
				}
			}

			const purchaseOrder = await PurchaseOrder.findByPk(
				purchaseOrderId,
				{
					attributes: ['id', 'total_receipt_discount', 'total_received_amount'],
				},
				{ transaction },
			);
			if (!purchaseOrder) {
				throw new Error(`OC con id ${purchaseOrderId} no encontrada`);
			}

			let newTotalReceiptDiscount = parseFloat(
				purchaseOrder.total_receipt_discount,
			);
			const newTotalReceivedAmount =
				parseFloat(purchaseOrder.total_received_amount) + parseFloat(net_total);

			if (discount) {
				newTotalReceiptDiscount += parseFloat(discount);
			}

			await purchaseOrder.update(
				{
					total_receipt_discount: newTotalReceiptDiscount,
					total_received_amount: newTotalReceivedAmount,
				},
				{ transaction },
			);

			await transaction.commit();
			return res.status(200).json({ message: `OC recibida exitosamente` });
		}
	} catch (error) {
		await transaction.rollback();
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};
