import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { ApprovalEvent } from '../models/ApprovalEvent.js';
import { transporter } from '../utils/nodemailer.js';
import { approvePoOptions } from '../utils/emailOptions.js';
import { Oeuvre } from '../models/Oeuvre.js';
import { getApproversOrderedByRole } from './approver.service.js';
import { sequelize } from '../database/database.js';
import { Supplier } from '../models/Supplier.js';
import { Approver } from '../models/Approver.js';
import { PurchaseOrderItem } from '../models/PurchaseOrderItem.js';
import { GeneralItem } from '../models/GeneralItem.js';
import { AccountCost } from '../models/AccountCost.js';
import { ItemReceipt } from '../models/ItemReceipt.js';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';

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
	transaction,
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
			await purchaseOrder.update(
				{
					current_approver_id: currentApprover.id,
				},
				{ transaction },
			);

			await ApprovalEvent.create(
				{
					author: submittedBy,
					status: 'Envío a aprobación',
					purchase_order_id: purchaseOrder.id,
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

			return { message: 'OC enviada a aprobación exitosamente' };
		} else {
			const purchaseOrderUpdated = await purchaseOrder.update(
				{
					status: 'Aprobada',
					current_approver_id: null,
					approval_date: new Date(),
				},
				{ transaction },
			);

			await ApprovalEvent.create(
				{
					author: submittedBy,
					status: 'Aprobada',
					purchase_order_id: purchaseOrder.id,
				},
				{ transaction },
			);

			return {
				message: 'OC aprobada exitosamente',
				purchaseOrder: purchaseOrderUpdated,
			};
		}
	} catch (error) {
		console.error(error);
		throw new Error(`Error al enviar la OC a aprobación: ${error.message}`);
	}
};

export const buildPurchaseOrdersIncludes = (
	includeItems,
	includeItemReceipts,
) => {
	const includes = [
		{
			model: Oeuvre,
			as: 'oeuvre',
			attributes: ['id', 'oeuvre_name'],
			required: false,
		},
		{
			model: Supplier,
			as: 'supplier',
			attributes: [],
			required: false,
		},
		{
			model: Approver,
			as: 'current_approver',
			attributes: ['user_id'],
		},
	];

	if (includeItems) {
		includes.push({
			model: PurchaseOrderItem,
			as: 'items',
			attributes: [
				'id',
				'purchase_order_id',
				'general_item_id',
				'description',
				'account_costs_id',
				'measurement_unit',
				'quantity',
				'unit_price',
				'subtotal',
				'total_received_quantity',
				'total_received_amount',
				'quantity_to_receive',
				'amount_to_receive',
				'receipt_status',
			],
			include: [
				{
					model: GeneralItem,
					attributes: ['name', 'sku'],
				},
				{
					model: AccountCost,
					attributes: ['identifier'],
				},
			],
			order: [['created_at', 'ASC']],
			required: false,
		});
	}

	if (includeItemReceipts) {
		includes.push({
			model: ItemReceipt,
			as: 'itemReceipts',
			attributes: [
				'id',
				'purchase_order_item_id',
				'created_at',
				'receipt_date',
				'doc_type',
				'doc_number',
				'status',
				'received_quantity',
				'received_amount',
			],
			include: [
				{
					model: PurchaseOrderItem,
					as: 'item',
					attributes: [
						'id',
						'general_item_id',
						'description',
						'measurement_unit',
						'unit_price',
					],
					include: [
						{
							model: GeneralItem,
							attributes: ['name', 'sku'],
						},
						{
							model: AccountCost,
							attributes: ['identifier', 'name'],
						},
					],
				},
			],
			order: [['created_at', 'ASC']],
			required: false,
		});
	}

	return includes;
};

export const buildPurchaseOrderByNumberInclude = () => [
	{
		model: Oeuvre,
		as: 'oeuvre',
		attributes: ['id', 'oeuvre_name', 'oeuvre_address', 'admin_name'],
		include: [
			{
				model: Company,
				as: 'company',
				attributes: ['id', 'image_url', 'business_name', 'rut'],
				required: false,
			},
		],
		required: false,
	},
	{
		model: Approver,
		as: 'current_approver',
		attributes: ['user_id'],
	},
	{
		model: Supplier,
		as: 'supplier',
		attributes: [],
		required: false,
	},
	{
		model: PurchaseOrderItem,
		as: 'items',
		attributes: [
			'id',
			'purchase_order_id',
			'general_item_id',
			'description',
			'account_costs_id',
			'measurement_unit',
			'quantity',
			'unit_price',
			'subtotal',
			'total_received_quantity',
			'total_received_amount',
			'quantity_to_receive',
			'amount_to_receive',
			'receipt_status',
		],
		include: [
			{
				model: GeneralItem,
				attributes: ['name', 'sku'],
			},
			{
				model: AccountCost,
				attributes: ['name', 'identifier'],
			},
		],
		order: [['created_at', 'ASC']],
		required: false,
	},
];

export const processPurchaseOrderResult = async (
	purchaseOrder,
	includeEvents,
) => {
	const result = purchaseOrder.toJSON();

	if (includeEvents) {
		const approvalEvents = await ApprovalEvent.findAll({
			where: { purchase_order_id: purchaseOrder.id },
			attributes: ['id', 'status', 'created_at', 'comments'],
			include: [
				{
					model: User,
					attributes: ['email', 'full_name'],
				},
				{
					model: Approver,
					as: 'approver_details',
					attributes: ['approver_role'],
				},
			],
			order: [['created_at', 'ASC']],
		});

		result.events = approvalEvents;
	}

	if (result.current_approver) {
		result.current_approver = result.current_approver.user_id;
	}

	if (result.items) {
		result.items = result.items.map(item => {
			const { general_item, account_cost, ...rest } = item;

			return {
				...rest,
				item_name: item.general_item?.name,
				item_sku: item.general_item?.sku,
				account_cost_name: item.account_cost?.name,
				account_cost_identifier: item.account_cost?.identifier,
			};
		});
	}

	return result;
};
