import Router from "express";
import {
  createGeneralItem,
  getAllGeneralItems,
} from "../controllers/generalItem.controller.js";

const router = Router();

router.post("/", createGeneralItem);
router.get("/", getAllGeneralItems);

export default router;
