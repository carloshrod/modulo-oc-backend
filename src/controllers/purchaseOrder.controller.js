import { GeneralItem } from "../models/GeneralItem.js";
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
import { Receipt } from "../models/Receipt.js";

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

    if (purchaseOrders?.length > 0) {
      return res.status(200).json(purchaseOrders);
    }

    return res.status(204).json({ message: "No se encontraron resultados" });
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
            "purchase_order_id",
            "general_item_id",
            "description",
            "account_costs_id",
            "measurement_unit",
            "quantity",
            "unit_price",
            "subtotal",
            "total_received_quantity",
            "total_received_amount",
            "quantity_to_receive",
            "amount_to_receive",
            "receipt_status",
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

export const receivePurchaseOrder = async (req, res) => {
  try {
    const { items, discount, net_total, ...rest } = req.body;

    if (items?.length > 0) {
      const purchaseOrderId = items[0].purchase_order_id;

      for (const item of items) {
        if (item.received_quantity > 0 && item.received_amount > 0) {
          const existingItem = await PurchaseOrderItem.findOne({
            where: { id: item.id },
          });

          if (existingItem) {
            const {
              quantity,
              subtotal,
              total_received_quantity,
              total_received_amount,
            } = existingItem;

            const newTotalReceivedQuantity =
              parseInt(total_received_quantity) +
              parseInt(item.received_quantity);

            const newTotalReceivedAmount =
              parseFloat(total_received_amount) +
              parseFloat(item.received_amount);
            let newReceiptStatus;

            const newQuantityToReceive =
              parseInt(quantity) - parseInt(newTotalReceivedQuantity);
            const newAmountToReceive =
              parseFloat(subtotal) - parseFloat(newTotalReceivedAmount);

            if (newTotalReceivedAmount === 0) {
              newReceiptStatus = "Sin recepción";
            } else if (newQuantityToReceive > 0 && newAmountToReceive > 0) {
              newReceiptStatus = "Recepción parcial";
            } else if (newQuantityToReceive === 0 && newAmountToReceive === 0) {
              newReceiptStatus = "Recepción completa";
            }

            await PurchaseOrderItem.update(
              {
                total_received_quantity: newTotalReceivedQuantity,
                total_received_amount: newTotalReceivedAmount,
                receipt_status: newReceiptStatus,
                quantity_to_receive: newQuantityToReceive,
                amount_to_receive: newAmountToReceive,
              },
              {
                where: { id: item.id },
              }
            );

            const iva = parseFloat(item.received_amount) * 0.19;
            const total = parseFloat(item.received_amount) + iva;

            await Receipt.create({
              ...rest,
              purchase_order_item_id: item.id,
              purchase_order_id: purchaseOrderId,
              net_total: parseFloat(item.received_amount),
              iva,
              total,
            });
          } else {
            return res.status(400).json({
              message: `No se encontró el item ${item.id} en la base de datos`,
            });
          }
        }
      }

      const purchaseOrder = await PurchaseOrder.findByPk(purchaseOrderId, {
        attributes: ["id", "receipt_discount", "received_amount"],
      });
      if (!purchaseOrder) {
        throw new Error(`OC con id ${purchaseOrderId} no encontrada`);
      }

      let newReceiptDiscount = parseFloat(purchaseOrder.receipt_discount);
      let newReceivedAmount =
        parseFloat(purchaseOrder.received_amount) + parseFloat(net_total);

      if (discount) {
        newReceiptDiscount += parseFloat(discount);
      }

      await purchaseOrder.update({
        receipt_discount: newReceiptDiscount,
        received_amount: newReceivedAmount,
      });

      return res.status(200).json({ message: `OC recibida exitosamente` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
