import { Router } from "express";
import {
  cancelPurchaseOrder,
  getPurchaseOrderByNumber,
  getPurchaseOrdersByOeuvre,
  savePurchaseOrder,
  sendPurchaseOrderForApproval,
  updatePurchaseOrder,
} from "../controllers/purchaseOrder.controller.js";
import { validatePurchaseOrder } from "../middlewares/validatePurchaseOrder.js";

const router = Router();

router.post("/", validatePurchaseOrder, savePurchaseOrder);
router.put("/:id", validatePurchaseOrder, updatePurchaseOrder);
router.patch("/:id", sendPurchaseOrderForApproval);
router.get("/:oeuvreId", getPurchaseOrdersByOeuvre);
router.get("/po-number/:poNumber", getPurchaseOrderByNumber);
router.delete("/:id", cancelPurchaseOrder);

export default router;
