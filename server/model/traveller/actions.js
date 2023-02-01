/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-undef */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { ITINERARY_STATUS } from '../../constants';
import {
	ItineraryModel, BlockModel,
} from '../../schemas';

/**
* @description service model function to handle the block of user.
* @param {String} specialistRef the unique _id of the specialist.
* @param {String} itineraryRef the unique _id of the itinerary.
* @author Pavleen Kaur
* @since 23 Sept, 2022
*/

export default ({
	id,
	specialistRef,
	itineraryRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!specialistRef || !itineraryRef) {
			return reject(ResponseUtility.GENERIC_ERR({ message: `Missing property ${specialistRef ? 'itineraryRef' : 'specialistRef'}.` }));
		}
		const itinerary = await ItineraryModel.findOne({ specialistRef, _id: itineraryRef });
		if (!itinerary) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Specialist already blocked!' }));
		}
		if (itinerary.itineraryStatus === ITINERARY_STATUS.COMPLETED || itinerary.itineraryStatus === ITINERARY_STATUS.CANCELLED) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'You cannot block on a completed or cancelled trip!' }));
		}
		await BlockModel.findOneAndUpdate(
			{ blockedBy: id, blockedUser: specialistRef },
			{ blockedBy: id, blockedUser: specialistRef, itineraryRef },
			{ upsert: true },
		);
		return resolve(ResponseUtility.SUCCESS({
			message: 'Specialist blocked successfully!',
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
