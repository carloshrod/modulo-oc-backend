import express from "express";
import cors from "cors";
import morgan from "morgan";
import router from "./routes/index.routes.js";

const app = express();

// Middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Router
app.use(router);

export default app;
