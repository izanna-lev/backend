/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import {
	ReservationModel,
} from '../../schemas';
/**
* @description service model function to delete a reservation.
* @param {String} reservationRef the _id of the reservation.
* @author Pavleen Kaur
* @since 10 August, 2022
*/

export default ({
	reservationRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!reservationRef) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing Property reservationRef' }));
		}
		await ReservationModel.findOneAndUpdate(
			{ _id: reservationRef },
			{ deleted: true },
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({
			message: 'Reservation Deleted Successfully!',
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
