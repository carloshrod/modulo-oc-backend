import { Supplier } from '../models/Supplier.js';

export const getSuppliersByCompany = async (_req, res) => {
	try {
		const suppliers = await Supplier.findAll();

		if (suppliers?.length > 0) {
			return res.status(200).json(suppliers);
		}

		return res.status(204).send();
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};
