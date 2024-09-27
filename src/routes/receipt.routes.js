import { Router } from 'express';
import {
	addInvoice,
	cancelReceipt,
	getReceiptsByPurchaseOrder,
} from '../controllers/receipt.controller.js';

const router = Router();

router.get('/:poId', getReceiptsByPurchaseOrder);
router.patch('/:id', addInvoice);
router.delete('/:id', cancelReceipt);

export default router;
