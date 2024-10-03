import AWS from 'aws-sdk';
import { env } from '../config/env.js';

const spacesEndpoint = new AWS.Endpoint(env.ENDPOINT);
const s3 = new AWS.S3({
	endpoint: spacesEndpoint,
});

const uploadFileAndGetUrl = async file => {
	try {
		await s3
			.putObject({
				ACL: 'public-read',
				Bucket: env.BUCKET_NAME,
				Key: file.name,
				Body: file.data,
			})
			.promise();

		const fileUrl = `https://${env.BUCKET_NAME}.${env.ENDPOINT}/${file.name}`;

		return fileUrl;
	} catch (error) {
		console.error(error);
	}
};

const generateUniqueId = () => {
	return Math.random().toString(36).slice(2, 11);
};

export const uploadFiles = async files => {
	try {
		const urlsArray = [];

		if (!files) return urlsArray;

		if (Array.isArray(files) && files?.length > 0) {
			for (const file of files) {
				const fileUrl = await uploadFileAndGetUrl(file);
				urlsArray.push({
					id: generateUniqueId(),
					thumbUrl: fileUrl,
					name: file.name,
				});
			}
			return urlsArray;
		}

		const fileUrl = await uploadFileAndGetUrl(files);
		urlsArray.push({
			id: generateUniqueId(),
			thumbUrl: fileUrl,
			name: files.name,
		});

		return urlsArray;
	} catch (error) {
		console.error(error);
	}
};

export const generateUpdatedAttachments = async (
	files,
	purchaseOrder,
	filesToKeep,
) => {
	try {
		const newAttachments = await uploadFiles(files);

		const currentAttachments = purchaseOrder.attachments || [];

		const attachmentsToKeep = currentAttachments.filter(attachment =>
			filesToKeep.includes(attachment.id),
		);

		const combinedAttachments = [...attachmentsToKeep, ...newAttachments];

		return combinedAttachments;
	} catch (error) {
		console.error(error);
	}
};
