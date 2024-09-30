import { env } from '../config/env.js';

const { EMAIL_USER, CLIENT_HOST } = env;

export const approvePoOptions = ({ mailTo, poNumber, oeuvreName }) => {
	const oeuvreSlug = oeuvreName?.toLowerCase().split(' ').join('-');

	return {
		from: `"Admin" ${EMAIL_USER}`,
		to: mailTo?.email,
		subject: 'Notificación de Aprobación de Orden de Compra',
		html: `Hola ${mailTo?.full_name},<br><br>
      Tienes una orden de compra para aprobar. Por favor, revísala en <strong><a href="${CLIENT_HOST}/orden-de-compra/${oeuvreSlug}/${poNumber.toLowerCase()}">${poNumber}</a></strong> y toma la acción correspondiente.<br><br>
      Gracias,<br>El equipo de administración.`,
	};
};

export const rejectPoOptions = ({ mailTo, poNumber, oeuvreName, comments }) => {
	const oeuvreSlug = oeuvreName?.toLowerCase().split(' ').join('-');

	return {
		from: `"Admin" ${EMAIL_USER}`,
		to: mailTo?.email,
		subject: 'Notificación de Rechazo de Orden de Compra',
		html: `Hola ${mailTo?.full_name},<br><br>
      La orden de compra <strong><a href="${CLIENT_HOST}/orden-de-compra/${oeuvreSlug}/${poNumber.toLowerCase()}">${poNumber}</a></strong> fue rechazada.<br><br>
      <strong>Comentarios: "<em>${comments}</em>"</strong><br><br>
      Gracias,<br>El equipo de administración.`,
	};
};
