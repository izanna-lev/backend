/* eslint-disable no-undef */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ITINERARY_STATUS } from '../../constants';
import {
	ItineraryModel,
} from '../../schemas';
/**
* @description service model function to handle the completion of itinerary.
* @param {String} itineraryRef the unique _id of the itinerary.
*/

export default ({
	itineraryRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!itineraryRef) {
			reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property itineraryRef!' }));
		}
		const [itinerary] = await ItineraryModel.aggregate([
			{ $match: { _id: Types.ObjectId(itineraryRef) } },
			{
				$project: {
					itineraryStatus: '$itineraryStatus',
					toDate: '$toDate',
					approved: { $ifNull: ['$approved', false] },
				},
			},
		]);
		/* If ONGOING Itinerary and hasn't reached its toDate() */
		if (itinerary.itineraryStatus === ITINERARY_STATUS.ONGOING && new Date() < itinerary.toDate) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Itinerary to Date has not reached yet!' }));
		}
		/* If not ONGOING, 1).it could upcoming & not approved by traveler
		                   2).or upcoming, approved with request cancellation */
		if (itinerary.itineraryStatus !== ITINERARY_STATUS.ONGOING) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Only ongoing itineraries can be completed' }));
		}
		await ItineraryModel.findOneAndUpdate(
			{ _id: itineraryRef },
			{ itineraryStatus: ITINERARY_STATUS.COMPLETED },
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({ message: 'Itinerary completed Successfully!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
