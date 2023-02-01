/* eslint-disable import/named */
/* eslint-disable no-promise-executor-return */
/* eslint-disable consistent-return */
/* eslint-disable no-async-promise-executor */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { ITINERARY_STATUS } from '../../constants';
import {
	ItineraryModel,
} from '../../schemas';

/**
* @description Service model function for traveller to request for cancellation of an itinerary
* @author Haswanth Reddy
*/

export default ({
	id,
	itineraryRef,
}) => new Promise(async (resolve, reject) => {
	try {
		const itineraryCheck = await ItineraryModel.findOne(
			{
				_id: itineraryRef,
				travellerRef: id,
				approved: { $exists: true },
				itineraryStatus: ITINERARY_STATUS.UPCOMING,
				cancellationRequest: { $exists: false },
			},
		);

		if (!itineraryCheck) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No itinerary found' }));
		}

		await ItineraryModel.findOneAndUpdate(
			{
				_id: itineraryRef,
			},
			{
				cancellationRequest: new Date(),
			},
		);

		return resolve(ResponseUtility.SUCCESS({ message: 'Itinerary cancellation request successfully' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
