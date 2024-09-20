import { body, validationResult } from "express-validator";

const requiredFields = [
  "name",
  "delivery_date",
  "delivery_address",
  "currency_type",
  "exchange_rate",
  "discount",
  "net_total",
  "iva",
  "total",
  "supplier_id",
];

export const validatePurchaseOrder = [
  body("items.*.general_item_id")
    .notEmpty()
    .withMessage(
      "Para crear un artículo en la OC, el campo 'Artículo' es requerido"
    )
    .isInt()
    .withMessage("El campo general_item_id debe ser un número entero"),

  ...requiredFields.map((field) =>
    body(field)
      .if(body("status").equals("En revisión"))
      .notEmpty()
      .withMessage(
        `Todos los campos son obligatorios cuando la orden se envía a revisión`
      )
  ),

  body("items")
    .if(body("status").equals("En revisión"))
    .isArray({ min: 1 })
    .withMessage(
      "Debe haber al menos un item en la orden cuando se envía a revisión"
    ),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array(), message: errors.array()[0].msg });
    }
    next();
  },
];
