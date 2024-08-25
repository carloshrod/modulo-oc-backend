import { GeneralItem } from "../models/GeneralItem.js";
import { generateSku } from "../utils/generateSKU.js";

export const createGeneralItem = async (req, res) => {
  const { name } = req.body;
  try {
    const sku = generateSku(name);
    const newGeneralItem = await GeneralItem.create(
      { sku, name },
      { fields: ["sku", "name"] }
    );

    return res.status(200).json(newGeneralItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllGeneralItems = async (_req, res) => {
  try {
    const generalItems = await GeneralItem.findAll();
    return res.status(200).json(generalItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
