import { Op } from 'sequelize';
import { Approver } from '../models/Approver.js';
import { User } from '../models/User.js';

export const getApproversOrderedByRole = async oeuvre_id => {
	try {
		const approvers = await Approver.findAll({
			where: {
				id_oeuvre: oeuvre_id,
				is_active: true,
				approver_role: {
					[Op.or]: ['approver1', 'approver2', 'approver3', 'approver4'],
				},
			},
			include: {
				model: User,
				attributes: ['email', 'full_name'],
			},
			order: [['approver_role', 'ASC']],
		});

		if (approvers?.length === 0) {
			throw new Error('No se encontraron aprobadores activos');
		}

		return approvers;
	} catch (error) {
		console.error(error);
		throw new Error(`Error al obtener aprobadores: ${error.message}`);
	}
};
