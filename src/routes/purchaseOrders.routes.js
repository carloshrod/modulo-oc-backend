import { Router } from "express";
import {
  cancelPurchaseOrder,
  getPurchaseOrderByNumber,
  getPurchaseOrdersByOeuvre,
  rejectPurchaseOrder,
  savePurchaseOrder,
  sendPurchaseOrderForApproval,
  updatePurchaseOrder,
} from "../controllers/purchaseOrder.controller.js";
import { validatePurchaseOrder } from "../middlewares/validatePurchaseOrder.js";

const router = Router();

router.post("/", validatePurchaseOrder, savePurchaseOrder);
router.get("/:oeuvreId", getPurchaseOrdersByOeuvre);
router.get("/po-number/:poNumber", getPurchaseOrderByNumber);
router.put("/:id", validatePurchaseOrder, updatePurchaseOrder);
router.patch("/:id", sendPurchaseOrderForApproval);
router.patch("/reject/:id", rejectPurchaseOrder);
router.delete("/:id", cancelPurchaseOrder);

export default router;
