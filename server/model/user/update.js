/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { TravellerModel } from '../../schemas';
import { NODE_ENV, SUCCESS_CODE } from '../../constants';
import { UsersDetailsService } from '.';
import { ImageUploadUtility } from '../../utility';

/**
 * @description service model function to handles the
 * updation of an user.
 * @author Abhinav Sharma
 * @since 10 March, 2021
 */

export default ({
	id,
	image,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!image) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property Image' }));
		}
		const imageName = `${NODE_ENV}-travellerImage-${Date.now()}`;
		await ImageUploadUtility(imageName, image);
		await TravellerModel.updateOne({ _id: id }, { image: imageName });
		const user = await UsersDetailsService({ id });
		if (user.code !== SUCCESS_CODE) {
			return reject(ResponseUtility.GENERIC_ERR({ message: user.message }));
		}
		return resolve(ResponseUtility.SUCCESS({ data: user.data }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
