import Router from "express";
import {
  getAllOeuvres,
  getOeuvreByName,
} from "../controllers/oeuvre.controller.js";

const router = Router();

router.get("/", getAllOeuvres);
router.get("/:name", getOeuvreByName);

export default router;
