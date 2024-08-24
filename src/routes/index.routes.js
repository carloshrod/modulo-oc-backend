import { Router } from "express";
import { sequelize } from "../database/database.js";

const router = Router();

router.get("/", (_req, res) => {
  res.send("Módulo OC - Backend");
});

router.use("/api/v1/ping", async (_req, res) => {
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

export default router;
