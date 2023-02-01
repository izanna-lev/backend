/* eslint-disable import/named */
import {
	ResponseUtility,
	RandomCodeUtility,
} from 'appknit-backend-bundle';
import { ImageUploadUtility } from '../../utility';

export default ({
	image,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!image) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing property image' }));
		}
		const imageName = `${Date.now()}-ticketImage-${RandomCodeUtility(3)}`;
		await ImageUploadUtility(imageName, image);
		return resolve(ResponseUtility.SUCCESS({ data: imageName }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
