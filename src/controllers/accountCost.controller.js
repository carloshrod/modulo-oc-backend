import { sequelize } from '../database/database.js';
import { AccountCost } from '../models/AccountCost.js';
import { FamiliesAccountCost } from '../models/FamiliesAccountCost.js';

export const getAccountCostsByCompany = async (req, res) => {
	try {
		const { idCompany } = req.params;

		const accountCosts = await FamiliesAccountCost.findAll({
			where: { id_company: idCompany },
			attributes: [
				'id',
				[sequelize.col('families_account_costs.name'), 'family_name'],
			],
			include: [
				{
					model: AccountCost,
					attributes: ['id', 'identifier', 'name'],
					as: 'accounts',
				},
			],
		});

		if (accountCosts?.length > 0) {
			return res.status(200).json(accountCosts);
		}

		return res.status(204).send();
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
};
