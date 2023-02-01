/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { SPECIALIST_ACTION } from '../../constants';
import {
	SpecialistModel,
} from '../../schemas';

/**
* @description service model function to handle the Activate/Deactivate of a Specialist.
* @param {String} specialistRef the _id of the specialist.
* @param {Number} action the action to be performed Activate/Deactivate.
* @author Pavleen Kaur
* @since 18 Sept, 2022
*/

export default ({
	specialistRef,
	action,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!specialistRef || !action) {
			return resolve(ResponseUtility.MISSING_PROPS({ message: `Missing property ${action ? 'specialistRef' : 'action'}!` }));
		}
		const specialist = await SpecialistModel.findOne({ _id: specialistRef });
		if (!specialist) {
			return resolve(ResponseUtility.MISSING_PROPS({ message: 'No specialist Found!' }));
		}
		if (action !== SPECIALIST_ACTION.ACTIVATE && action !== SPECIALIST_ACTION.DEACTIVATE) {
			return resolve(ResponseUtility.MISSING_PROPS({ message: 'Invalid Action!' }));
		}
		if (action === SPECIALIST_ACTION.ACTIVATE) {
			await SpecialistModel.findOneAndUpdate(
				{ _id: specialistRef },
				{ blocked: false },
			);
		} else {
			await SpecialistModel.findOneAndUpdate(
				{ _id: specialistRef },
				{ blocked: true },
			);
		}

	    return resolve(ResponseUtility.SUCCESS({ message: `Specialist Account ${action === SPECIALIST_ACTION.ACTIVATE ? 'Activated' : 'Deactivated'}!` }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
