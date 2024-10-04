import { body, validationResult } from 'express-validator';

const requiredFields = ['receipt_date', 'doc_type', 'doc_number'];

export const validateReceipts = [
	...requiredFields.map(field =>
		body(field)
			.notEmpty()
			.withMessage(
				`El campo ${field} es obligatorio al realizar una recepción`,
			),
	),

	body('items.*.received_quantity')
		.isInt({ min: 1 })
		.withMessage('La cantidad recibida debe ser mayor a cero'),

	body('items.*.received_amount')
		.isInt({ min: 1 })
		.withMessage('El monto recibido debe ser mayor a cero'),

	body('discount')
		.optional()
		.if(body('discount').not().isEmpty())
		.isInt()
		.withMessage('El descuento debe ser un número entero'),

	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res
				.status(400)
				.json({ errors: errors.array(), message: errors.array()[0].msg });
		}
		next();
	},
];
