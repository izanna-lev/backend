/* eslint-disable max-len */
/* eslint-disable import/named */
import { ResponseUtility } from 'appknit-backend-bundle';
import { TravellerModel, SpecialistModel } from '../../schemas';
import { USER_FILTER } from '../../constants';

export default ({
	userFilter = USER_FILTER.TRAVELLER,
}) => new Promise(async (resolve, reject) => {
	try {
		let userList;
		const traveller = await TravellerModel.find({ deleted: false, blocked: false },
			{
				name: 1, image: 1, email: 1,
			});
		const specialist = await SpecialistModel.find({ deleted: false, blocked: false },
			{
				name: 1, image: 1, email: 1,
			});
		if (userFilter === USER_FILTER.TRAVELLER) {
			userList = traveller;
		} else if (userFilter === USER_FILTER.SPECIALIST) {
			userList = specialist;
		} else if (userFilter === USER_FILTER.ALL) {
			userList = traveller.concat(specialist);
		}
		return resolve(ResponseUtility.SUCCESS({
			data: userList,
		}));
	} catch (error) {
		return reject(ResponseUtility.GENERIC_ERR({ message: error.message, error }));
	}
});
