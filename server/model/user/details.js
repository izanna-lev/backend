/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { TravellerModel } from '../../schemas';

/**
 * @description service model function to handles the details of a user.
 * @author Abhinav Sharma
 * @since 10 March, 2021
 */

export default ({
	id,
}) => new Promise(async (resolve, reject) => {
	try {
		const [user] = await TravellerModel.aggregate([
			{
				$match: {
					_id: Types.ObjectId(id),
					deleted: false,
					blocked: false,
				},
			},
			{
				$project: {
					name: '$name',
					image: '$image',
					email: '$email',
				},
			},
		]);
		if (!user) {
			return reject(ResponseUtility.NO_USER());
		}
		return resolve(ResponseUtility.SUCCESS({
			message: 'Profile fetcheded successfully',
			data: user,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
