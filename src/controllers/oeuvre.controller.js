import { Op } from 'sequelize';
import { Oeuvre } from '../models/Oeuvre.js';

export const getAllOeuvres = async (_req, res) => {
	try {
		const oeuvres = await Oeuvre.findAll({
			attributes: ['id', 'oeuvre_name', 'id_company'],
			order: [['id', 'ASC']],
		});
		res.status(200).json(oeuvres);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};

export const getOeuvreByName = async (req, res) => {
	try {
		const { name } = req.params;
		const normalizedName = name.replace(/-/g, ' ').toLowerCase().trim();

		const oeuvre = await Oeuvre.findOne({
			where: {
				oeuvre_name: {
					[Op.iLike]: `%${normalizedName}%`,
				},
			},
			attributes: ['id', 'oeuvre_name', 'id_company'],
		});
		res.status(200).json(oeuvre);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};
