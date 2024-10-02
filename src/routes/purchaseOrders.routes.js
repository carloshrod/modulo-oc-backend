import { Router } from 'express';
import {
	cancelPurchaseOrder,
	getPurchaseOrderByNumber,
	getPurchaseOrdersByOeuvre,
	receivePurchaseOrder,
	rejectPurchaseOrder,
	savePurchaseOrder,
	sendPurchaseOrderForApproval,
	updatePurchaseOrder,
} from '../controllers/purchaseOrder.controller.js';
import { validatePurchaseOrder } from '../middlewares/validatePurchaseOrder.js';
import { sanitizeBody } from '../middlewares/sanitizeBody.js';

const router = Router();

router.post('/', sanitizeBody, validatePurchaseOrder, savePurchaseOrder);
router.get('/:oeuvreId', getPurchaseOrdersByOeuvre);
router.get('/:oeuvreId/:poNumber', getPurchaseOrderByNumber);
router.put('/:id', sanitizeBody, validatePurchaseOrder, updatePurchaseOrder);
router.patch('/:id', sendPurchaseOrderForApproval);
router.patch('/reject/:id', rejectPurchaseOrder);
router.delete('/:id', cancelPurchaseOrder);
router.post('/receive', receivePurchaseOrder);

export default router;
