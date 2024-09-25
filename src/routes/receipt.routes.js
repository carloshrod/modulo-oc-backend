import { Router } from 'express';
import {
	addInvoice,
	getReceiptsByPurchaseOrder,
} from '../controllers/receipt.controller.js';

const router = Router();

router.get('/:poId', getReceiptsByPurchaseOrder);
router.patch('/:id', addInvoice);

export default router;
