import app from './app.js';
import { sequelize } from './database/database.js';

const PORT = process.env.PORT || 4000;

async function main() {
	try {
		await sequelize.sync();
		console.log('Connection has been established successfully.');
		app.listen(PORT, () => {
			console.log(`********** Server listening on port ${PORT} **********`);
		});
	} catch (error) {
		console.error('Unable to connect to the database:', error);
	}
}

main();
