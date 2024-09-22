import { GeneralItem } from "../models/GeneralItem.js";
import { Oeuvre } from "../models/Oeuvre.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { PurchaseOrderItem } from "../models/PurchaseOrderItem.js";
import { AccountCost } from "../models/AccountCost.js";
import { Supplier } from "../models/Supplier.js";
import {
  generatePurchaseOrderNumber,
  getPurchaseOrderWithSupplierInfo,
  sendPurchaseOrderForApprovalService,
} from "../services/purchaseOrder.service.js";
import { getApproversOrderedByRole } from "../services/approver.service.js";
import { ApprovalEvent } from "../models/ApprovalEvent.js";
import { User } from "../models/User.js";
import { Approver } from "../models/Approver.js";
import { sequelize } from "../database/database.js";
import { validatePoItems } from "../utils/validatePoItems.js";
import { transporter } from "../utils/nodemailer.js";
import { rejectPoOptions } from "../utils/emailOptions.js";

export const savePurchaseOrder = async (req, res) => {
  try {
    const { oeuvre_id, items, status, submittedBy, ...rest } = req.body;

    const newOrderNumber = await generatePurchaseOrderNumber(oeuvre_id);

    const newPurchaseOrder = await PurchaseOrder.create({
      ...rest,
      number: newOrderNumber,
      oeuvre_id: oeuvre_id,
      approval_date: null,
      reception_date: null,
      user_create: submittedBy,
      status: status,
    });

    let itemIds = [];
    if (items?.length > 0) {
      const validItems = validatePoItems(items);

      if (validItems?.length > 0) {
        await Promise.all(
          items.map(async (item) => {
            const newItem = await PurchaseOrderItem.create({
              ...item,
              purchase_order_id: newPurchaseOrder.id,
              subtotal: item.subtotal === 0 ? undefined : item.subtotal,
            });
            itemIds.push(newItem.id);
            return newItem;
          })
        );
      }
    }

    if (itemIds?.length > 0 && status === "En revisión") {
      const response = await sendPurchaseOrderForApprovalService(
        newPurchaseOrder,
        submittedBy
      );
      return res.status(200).json({
        message: response.message,
        purchaseOrder: {
          ...newPurchaseOrder.dataValues,
          items: itemIds,
        },
      });
    }

    return res.status(200).json({
      message: "Orden de compra guardada como borrador!",
      purchaseOrder: {
        ...newPurchaseOrder.dataValues,
        items: itemIds,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, submittedBy, ...rest } = req.body;

    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: "Orden de compra no encontrada" });
    }

    await purchaseOrder.update({ ...rest, user_update: submittedBy });

    const existingItems = await PurchaseOrderItem.findAll({
      where: { purchase_order_id: id },
    });

    let itemIds = [];
    if (items?.length > 0) {
      const validItems = validatePoItems(items);

      if (validItems?.length > 0) {
        for (const item of validItems) {
          if (item?.id) {
            await PurchaseOrderItem.update(
              { ...item },
              { where: { id: item.id } }
            );
            itemIds.push(item.id);
          } else {
            const newItem = await PurchaseOrderItem.create({
              ...item,
              purchase_order_id: purchaseOrder.id,
            });
            itemIds.push(newItem.id);
          }
        }
      }
    } else {
      if (existingItems?.length > 0) {
        for (const existingItem of existingItems) {
          await existingItem.destroy();
        }
      }
    }

    if (itemIds?.length > 0 && existingItems?.length > 0) {
      for (const existingItem of existingItems) {
        if (!itemIds.includes(existingItem.id)) {
          await existingItem.destroy();
        }
      }
    }

    if (itemIds?.length > 0 && purchaseOrder.status === "En revisión") {
      const response = await sendPurchaseOrderForApprovalService(
        purchaseOrder,
        submittedBy
      );
      return res.status(200).json({
        message: response.message,
        purchaseOrder: {
          ...purchaseOrder.dataValues,
          items: itemIds,
        },
      });
    }

    return res.status(200).json({
      message: "Orden de compra guardada como borrador!",
      purchaseOrder: {
        ...purchaseOrder.dataValues,
        items: itemIds,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const sendPurchaseOrderForApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { submittedBy } = req.body;

    const purchaseOrder = await getPurchaseOrderWithSupplierInfo(id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: "Orden de compra no encontrada" });
    }

    const response = await sendPurchaseOrderForApprovalService(
      purchaseOrder,
      submittedBy
    );

    return res.status(200).json({
      message: response.message,
      purchaseOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getPurchaseOrdersByOeuvre = async (req, res) => {
  try {
    const { oeuvreId } = req.params;

    const purchaseOrders = await PurchaseOrder.findAll({
      where: { oeuvre_id: oeuvreId },
      attributes: {
        include: [
          [sequelize.col("supplier.supplier_rut"), "supplier_rut"],
          [sequelize.col("supplier.supplier_name"), "supplier_name"],
        ],
      },
      include: [
        {
          model: Supplier,
          as: "supplier",
          attributes: [],
          required: false,
        },
        {
          model: Approver,
          as: "current_approver",
          attributes: ["user_id"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(purchaseOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getPurchaseOrderByNumber = async (req, res) => {
  try {
    const { poNumber } = req.params;
    const includeEvents = req.query.includeEvents === "true";

    const purchaseOrder = await PurchaseOrder.findOne({
      where: { number: poNumber.replace("oc", "OC") },
      attributes: [
        "id",
        "oeuvre_id",
        "number",
        "name",
        "gloss",
        "supplier_id",
        [sequelize.col("supplier.supplier_rut"), "supplier_rut"],
        [sequelize.col("supplier.supplier_name"), "supplier_name"],
        "delivery_date",
        "delivery_address",
        "currency_type",
        "exchange_rate",
        "discount",
        "net_total",
        "iva",
        "total",
        "status",
      ],
      include: [
        {
          model: Approver,
          as: "current_approver",
          attributes: ["user_id"],
        },
        {
          model: Supplier,
          as: "supplier",
          attributes: [],
          required: false,
        },
        {
          model: PurchaseOrderItem,
          as: "items",
          attributes: [
            "id",
            "general_item_id",
            "description",
            "account_costs_id",
            "measurement_unit",
            "quantity",
            "unit_price",
            "subtotal",
          ],
          include: [
            {
              model: GeneralItem,
              attributes: ["name", "sku"],
            },
            {
              model: AccountCost,
              attributes: ["name"],
            },
          ],
          order: [["created_at", "ASC"]],
          required: false,
        },
      ],
    });

    let result = purchaseOrder.toJSON();

    if (includeEvents) {
      const approvalEvents = await ApprovalEvent.findAll({
        where: { purchase_order_id: purchaseOrder.id },
        attributes: ["id", "status", "created_at", "comments"],
        include: [
          {
            model: User,
            attributes: ["email", "full_name"],
          },
          {
            model: Approver,
            as: "approver_details",
            attributes: ["approver_role"],
          },
        ],
        order: [["created_at", "ASC"]],
      });

      result.events = approvalEvents;
    }

    if (result.current_approver) {
      result.current_approver = result.current_approver.user_id;
    }

    if (result.items) {
      result.items = result.items.map((item) => {
        const { general_item, account_cost, ...rest } = item;

        return {
          ...rest,
          item_name: item.general_item?.name,
          item_sku: item.general_item?.sku,
          account_cost_name: item.account_cost?.name,
        };
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const rejectPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, comments } = req.body;

    const purchaseOrder = await getPurchaseOrderWithSupplierInfo(id);
    const approvers = await getApproversOrderedByRole(purchaseOrder.oeuvre_id);

    let currentApprover;
    if (approvers?.length > 0) {
      const currentApproverIndex = approvers.findIndex(
        (approver) => approver.user_id === rejectedBy
      );
      currentApprover = approvers[currentApproverIndex - 1] || null;
    }

    let mailTo = {
      email: currentApprover?.user?.email,
      full_name: currentApprover?.user?.full_name,
    };
    if (!currentApprover) {
      const userCreate = await User.findByPk(purchaseOrder.user_create, {
        attributes: ["email", "full_name"],
      });

      mailTo = { email: userCreate.email, full_name: userCreate.full_name };
    }

    if (mailTo) {
      await purchaseOrder.update({
        user_update: rejectedBy,
        status: "Rechazada",
        current_approver_id: currentApprover?.id || null,
      });

      await ApprovalEvent.create({
        author: rejectedBy,
        status: "Rechazada",
        purchase_order_id: purchaseOrder.id,
        comments,
      });

      transporter.sendMail(
        rejectPoOptions(mailTo, purchaseOrder?.number, comments),
        (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log("Correo enviado: " + info.response);
          }
        }
      );

      return res.status(200).json({
        purchaseOrder,
        message: `Orden de compra rechazada exitosamente`,
      });
    }

    return res.status(400).json({
      message: `Ocurrió un error al intentar rechazar la orden de compra`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const cancelPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { canceledBy } = req.body;

    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: "Orden de compra no encontrada" });
    }

    const newStatus =
      purchaseOrder.status === "Borrador" ? "Cancelada" : "Cerrada";

    await purchaseOrder.update({ user_update: canceledBy, status: newStatus });

    return res.status(200).json({
      newStatus,
      message: `Orden de compra ${newStatus?.toLocaleLowerCase()} exitosamente`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
