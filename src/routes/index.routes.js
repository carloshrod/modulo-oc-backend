import { Router } from 'express';
import { sequelize } from '../database/database.js';
import oeuvreRouter from './oeuvre.routes.js';
import generalItemRouter from './generalItems.routes.js';
import purchaseOrdersRouter from './purchaseOrders.routes.js';
import receiptRouter from './receipt.routes.js';
import { Supplier } from '../models/Supplier.js';
import { AccountCost } from '../models/AccountCost.js';
import { FamiliesAccountCost } from '../models/FamiliesAccountCost.js';

const router = Router();

router.get('/', (_req, res) => {
	res.send('Módulo OC - Backend');
});

router.get('/api/v1/ping', async (_req, res) => {
	try {
		await sequelize.authenticate();
		return res.status(200).send({
			apiSays: 'Server status is OK!',
			PostgreSays: 'Database connection is OK!',
		});
	} catch (error) {
		console.error(error);
	}
});

router.get('/api/v1/suppliers', async (_req, res) => {
	try {
		const suppliers = await Supplier.findAll();
		res.json(suppliers);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
});

router.get('/api/v1/account-costs/:idCompany', async (req, res) => {
	try {
		const { idCompany } = req.params;

		const accountCosts = await FamiliesAccountCost.findAll({
			where: { id_company: idCompany },
			attributes: [
				'id',
				[sequelize.col('families_account_costs.name'), 'family_name'],
			],
			include: [
				{
					model: AccountCost,
					attributes: ['id', 'identifier', 'name'],
					as: 'accounts',
				},
			],
		});
		res.json(accountCosts);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
});

router.use('/api/v1/oeuvres', oeuvreRouter);
router.use('/api/v1/general-items', generalItemRouter);
router.use('/api/v1/purchase-orders', purchaseOrdersRouter);
router.use('/api/v1/receipts', receiptRouter);

export default router;
