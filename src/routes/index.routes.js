import { Router } from "express";
import { sequelize } from "../database/database.js";
import { Oeuvre } from "../models/Oeuvre.js";
import purchaseOrdersRouter from "./purchaseOrders.routes.js";
import generalItemRouter from "./generalItems.routes.js";
import { Supplier } from "../models/Supplier.js";

const router = Router();

router.get("/", (_req, res) => {
  res.send("Módulo OC - Backend");
});

router.get("/api/v1/ping", async (_req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).send({
      apiSays: "Server status is OK!",
      PostgreSays: "Database connection is OK!",
    });
  } catch (error) {
    console.error(error);
  }
});

router.get("/api/v1/oeuvres", async (req, res) => {
  try {
    const oeuvres = await Oeuvre.findAll({
      attributes: ["id", "oeuvre_name"],
    });
    res.json(oeuvres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/v1/suppliers", async (req, res) => {
  try {
    const suppliers = await Supplier.findAll();
    res.json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.use("/api/v1/general-items", generalItemRouter);
router.use("/api/v1/purchase-orders", purchaseOrdersRouter);

export default router;
