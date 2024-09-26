import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { ApprovalEvent } from '../models/ApprovalEvent.js';
import { transporter } from '../utils/nodemailer.js';
import { approvePoOptions } from '../utils/emailOptions.js';
import { Oeuvre } from '../models/Oeuvre.js';
import { getApproversOrderedByRole } from './approver.service.js';
import { sequelize } from '../database/database.js';
import { Supplier } from '../models/Supplier.js';

export const generatePurchaseOrderNumber = async oeuvre_id => {
	try {
		const oeuvre = await Oeuvre.findByPk(oeuvre_id, {
			attributes: ['ceco_code'],
		});
		if (!oeuvre) {
			throw new Error('Oeuvre not found');
		}

		const lastPurchaseOrder = await PurchaseOrder.findOne({
			attributes: ['number'],
			where: { oeuvre_id },
			order: [['created_at', 'DESC']],
		});

		let newOrderNumber;
		if (lastPurchaseOrder) {
			const lastNumber = parseInt(
				lastPurchaseOrder.number.split('-').pop(),
				10,
			);
			newOrderNumber = `OC-${oeuvre.ceco_code}-${lastNumber + 1}`;
		} else {
			newOrderNumber = `OC-${oeuvre.ceco_code}-1`;
		}

		if (!newOrderNumber) {
			throw new Error('Error al generar el número de la orden de compra');
		}

		return newOrderNumber;
	} catch (error) {
		console.error(error);
		throw new Error(
			`Error al generar el número de la orden de compra: ${error.message}`,
		);
	}
};

export const getPurchaseOrderWithSupplierInfo = async id => {
	try {
		const purchaseOrder = await PurchaseOrder.findByPk(id, {
			attributes: {
				include: [
					[sequelize.col('supplier.supplier_rut'), 'supplier_rut'],
					[sequelize.col('supplier.supplier_name'), 'supplier_name'],
				],
			},
			include: [
				{
					model: Supplier,
					as: 'supplier',
					attributes: [],
					required: false,
				},
			],
		});

		if (!purchaseOrder) throw new Error('Orden de compra no encontrada');

		return purchaseOrder;
	} catch (error) {
		console.error(error);
		throw new Error(`Error al obtener orden de compra: ${error.message}`);
	}
};

export const sendPurchaseOrderForApprovalService = async (
	purchaseOrder,
	submittedBy,
) => {
	try {
		const approvers = await getApproversOrderedByRole(purchaseOrder.oeuvre_id);

		let currentApprover;
		const isSubmitterAnApprover = approvers.find(
			approver => approver.user_id === submittedBy,
		);

		if (!isSubmitterAnApprover) {
			currentApprover = approvers.find(
				approver => approver.approver_role === 'approver1',
			);
		} else {
			const currentApproverIndex = approvers.findIndex(
				approver => approver.user_id === submittedBy,
			);
			currentApprover = approvers[currentApproverIndex + 1] || null;
		}

		if (currentApprover) {
			await purchaseOrder.update({
				current_approver_id: currentApprover.id,
			});

			const oeuvre = await Oeuvre.findByPk(purchaseOrder.oeuvre_id, {
				attributes: ['id', 'oeuvre_name'],
			});
			if (!oeuvre) {
				throw new Error('Oeuvre not found');
			}
			const data = {
				mailTo: currentApprover?.user,
				poNumber: purchaseOrder?.number,
				oeuvreName: oeuvre?.oeuvre_name,
			};

			transporter.sendMail(approvePoOptions(data), (error, info) => {
				if (error) {
					console.log(error);
				} else {
					console.log('Correo enviado: ' + info.response);
				}
			});

			await ApprovalEvent.create({
				author: submittedBy,
				status: 'Envío a aprobación',
				purchase_order_id: purchaseOrder.id,
			});

			return { message: 'OC enviada a aprobación exitosamente' };
		} else {
			const purchaseOrderUpdated = await purchaseOrder.update({
				status: 'Aprobada',
				current_approver_id: null,
				approval_date: new Date(),
			});

			await ApprovalEvent.create({
				author: submittedBy,
				status: 'Aprobada',
				purchase_order_id: purchaseOrder.id,
			});

			return {
				message: 'OC aprobada exitosamente',
				purchaseOrder: purchaseOrderUpdated,
			};
		}
	} catch (error) {
		console.error(error);
		throw new Error(
			`Error al enviar la notificación de aprobación: ${error.message}`,
		);
	}
};
