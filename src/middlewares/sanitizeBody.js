export const sanitizeBody = (req, res, next) => {
	try {
		const { body } = req;
		for (const key in body) {
			if (body[key] === 'null') {
				body[key] = null;
			} else if (
				(key === 'items' || key === 'filesToKeep') &&
				typeof body[key] === 'string'
			) {
				try {
					body[key] = JSON.parse(body[key]);
				} catch (error) {
					console.error('Error parsing JSON:', error);
				}
			} else if (typeof body[key] === 'object' && !Array.isArray(body[key])) {
				sanitizeBody(body[key]);
			} else if (!isNaN(parseFloat(body[key]))) {
				body[key] = parseFloat(body[key]);
			}
		}
		next();
	} catch (error) {
		console.error(error);
	}
};
