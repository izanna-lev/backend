/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import {
	SpecialistModel,
} from '../../schemas';

/**
* @description service model function to handle the delete of a Specialist.
* @param {String} specialistRef the _id of the specialist.
* @author Pavleen Kaur
* @since 18 Sept, 2022
*/

export default ({
	specialistRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!specialistRef) {
			return resolve(ResponseUtility.MISSING_PROPS({ message: 'Missing property specialistRef!' }));
		}
		const specialist = await SpecialistModel.findOne({ _id: specialistRef });
		if (!specialist) {
			return resolve(ResponseUtility.MISSING_PROPS({ message: 'No specialist Found!' }));
		}
	    await SpecialistModel.findOneAndUpdate(
			{ _id: specialistRef },
			{ deleted: true },
		);
	    return resolve(ResponseUtility.SUCCESS({ message: 'Specialist Deleted Successfully!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
