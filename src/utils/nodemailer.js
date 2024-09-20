import nodemailer from "nodemailer";
import { config } from "dotenv";
config();

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});
