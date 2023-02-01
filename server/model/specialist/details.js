/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { SpecialistModel } from '../../schemas';

export default ({
	id,
	timezone,
}) => new Promise(async (resolve, reject) => {
	try {
		const specialist = await SpecialistModel.findOne(
			{ _id: id },
			{
				deleted: 0, blocked: 0, password: 0, __v: 0, device: 0, fcmToken: 0,
			},
		);
		if (!specialist) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No Specialist Found!' }));
		}
		await SpecialistModel.findOneAndUpdate({ _id: id },
			{ zone: timezone });
		return resolve(ResponseUtility.SUCCESS({
			message: 'Specialist Profile fetcheded Successfully!',
			data: specialist,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
