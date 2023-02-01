/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import {
	TransportationModel, TicketModel,
} from '../../schemas';
/**
* @description service model function to delete a transportation.
* @param {String} transportationRef the _id of the transportation.
* @author Pavleen Kaur
* @since 25 August, 2022
*/

export default ({
	transportationRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!transportationRef) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing Property transportationRef' }));
		}
		await TransportationModel.findOneAndUpdate(
			{ _id: transportationRef },
			{ deleted: true },
			{ new: true },
		);
		await TicketModel.updateMany(
			{ transportationRef },
			{ deleted: true },
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({
			message: 'Transportation Deleted Successfully!',
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
