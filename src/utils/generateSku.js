export const generateSku = productName => {
	try {
		const namePart = productName.substring(0, 3).toUpperCase();

		const timestampPart = Date.now().toString();

		const newSku = `${namePart}-${timestampPart}`;

		return newSku;
	} catch (error) {
		console.error(error);
	}
};
