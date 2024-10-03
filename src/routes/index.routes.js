import { Router } from 'express';
import { sequelize } from '../database/database.js';
import oeuvreRouter from './oeuvre.routes.js';
import generalItemRouter from './generalItems.routes.js';
import purchaseOrdersRouter from './purchaseOrders.routes.js';
import receiptRouter from './receipt.routes.js';
import { getSuppliersByCompany } from '../controllers/supplier.controller.js';
import { getAccountCostsByCompany } from '../controllers/accountCost.controller.js';

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

router.get('/api/v1/suppliers', getSuppliersByCompany);
router.get('/api/v1/account-costs/:idCompany', getAccountCostsByCompany);
router.use('/api/v1/oeuvres', oeuvreRouter);
router.use('/api/v1/general-items', generalItemRouter);
router.use('/api/v1/purchase-orders', purchaseOrdersRouter);
router.use('/api/v1/receipts', receiptRouter);

export default router;
