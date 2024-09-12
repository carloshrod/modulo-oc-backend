import { Router } from "express";
import {
  deletePurchaseOrder,
  getPurchaseOrderByNumber,
  getPurchaseOrdersByOeuvre,
  savePurchaseOrder,
  sendPurchaseOrderForApproval,
  updatePurchaseOrder,
} from "../controllers/purchaseOrder.controller.js";

const router = Router();

router.post("/", savePurchaseOrder);
router.put("/:id", updatePurchaseOrder);
router.patch("/:id", sendPurchaseOrderForApproval);
router.get("/:oeuvreId", getPurchaseOrdersByOeuvre);
router.get("/po-number/:poNumber", getPurchaseOrderByNumber);
router.delete("/:purchaseOrderId", deletePurchaseOrder);

export default router;
