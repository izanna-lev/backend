/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { SpecialistModel } from '../../schemas';
import { NODE_ENV } from '../../constants';
import { ImageUploadUtility } from '../../utility';

export default ({
	id,
	image,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!image) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property image' }));
		}
		const imageName = `${NODE_ENV}-specialistImage-${Date.now()}`;
		await ImageUploadUtility(imageName, image);

		const specialist = await SpecialistModel.findOneAndUpdate(
			{ _id: id },
			{ image: imageName },
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({
			message: 'Specialist profile picture updated successfully!',
			data: {
				specialist: {
					...specialist._doc,
					password: undefined,
					blocked: undefined,
					deleted: undefined,
				    createdOn: undefined,
					updatedOn: undefined,

				},
			},

		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
