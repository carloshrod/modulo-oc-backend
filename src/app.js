import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/index.routes.js';
import fileUpload from 'express-fileupload';

const app = express();

// Middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
	fileUpload({
		tempFileDir: '/temp',
		limits: { fileSize: 10 * 1024 * 1024 },
	}),
);

// Router
app.use(router);

export default app;
