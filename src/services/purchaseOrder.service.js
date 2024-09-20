import { Op } from "sequelize";
import { Approver } from "../models/Approver.js";
import { User } from "../models/User.js";
import { transporter } from "../utils/nodemailer.js";
import { ApprovalEvent } from "../models/ApprovalEvent.js";

export const sendPurchaseOrderForApprovalService = async (
  purchaseOrder,
  submittedBy
) => {
  try {
    const approvers = await Approver.findAll({
      where: {
        id_oeuvre: purchaseOrder?.oeuvre_id,
        is_active: true,
        approver_role: {
          [Op.or]: ["approver1", "approver2", "approver3", "approver4"],
        },
      },
      include: {
        model: User,
        attributes: ["email", "full_name"],
      },
      order: [["approver_role", "ASC"]],
    });

    if (approvers.length === 0) {
      throw new Error("No se encontraron aprobadores activos.");
    }

    let currentApprover;
    const isSubmitterAnApprover = approvers.find(
      (approver) => approver.user_id === submittedBy
    );

    if (!isSubmitterAnApprover) {
      currentApprover = approvers.find(
        (approver) => approver.approver_role === "approver1"
      );
    } else {
      const currentApproverIndex = approvers.findIndex(
        (approver) => approver.user_id === submittedBy
      );
      currentApprover = approvers[currentApproverIndex + 1] || null;
    }

    if (currentApprover) {
      await purchaseOrder.update({
        current_approver_id: currentApprover.id,
      });

      const mailOptions = {
        from: `"Admin" ${process.env.EMAIL}`,
        to: currentApprover.user.email,
        subject: "Notificación de Aprobación de Orden de Compra",
        html: `Hola ${currentApprover?.user?.full_name},<br><br>
          Tienes una orden de compra para aprobar. Por favor, revisa la <strong>${purchaseOrder.number}</strong>.<br><br>
          Gracias,<br>El equipo de administración.`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Correo enviado: " + info.response);
        }
      });

      await ApprovalEvent.create({
        author: submittedBy,
        status: "Envío a aprobación",
        purchase_order_id: purchaseOrder.id,
      });

      return { message: "Orden de compra enviada a aprobación!" };
    } else {
      const purchaseOrderUpdated = await purchaseOrder.update({
        status: "Aprobada",
        current_approver_id: null,
        approval_date: new Date(),
      });

      await ApprovalEvent.create({
        author: submittedBy,
        status: "Aprobada",
        purchase_order_id: purchaseOrder.id,
      });

      return {
        message: "Orden de compra aprobada exitosamente",
        purchaseOrder: purchaseOrderUpdated,
      };
    }
  } catch (error) {
    console.error(error);
    throw new Error(
      `Error al enviar la notificación de aprobación: ${error.message}`
    );
  }
};
