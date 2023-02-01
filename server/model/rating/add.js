/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-async-promise-executor */
/* eslint-disable import/named */
/* eslint-disable no-promise-executor-return */
import {
	ResponseUtility, PropsValidationUtility,
} from 'appknit-backend-bundle';
import { ITINERARY_STATUS } from '../../constants';
import {
	ItineraryModel,
} from '../../schemas';

/**
* @description service model function to handle the adding of Rating.
* @param {String} itineraryRef the unique _id of the itinerary.
* @param {Number} experience the experience rating.
* @param {Number} specialist the specialist rating.
* @param {Number} value the value rating.
*/

export default ({
	id,
	itineraryRef,
	experience,
	specialist,
	value,
}) => new Promise(async (resolve, reject) => {
	try {
		const { code, message } = await PropsValidationUtility({
			validProps: ['itineraryRef', 'experience', 'specialist', 'value'],
			sourceDocument: {
			    itineraryRef,
				experience,
				specialist,
				value,
			},
		});

		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}
		const itinerary = await ItineraryModel.findOne({ _id: itineraryRef, travellerRef: id });
		if (!itinerary) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No itinerary found' }));
		}

		const completed = (
			itinerary.itineraryStatus === ITINERARY_STATUS.COMPLETED
            && itinerary.approved
            && (new Date() > new Date(itinerary.toDate))
		);

		if (!completed) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Rating can be added only to completed itinerary' }));
		}

		const ratingCheck = await ItineraryModel.findOne({ _id: itineraryRef });
		if (ratingCheck.rating) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Rating already added' }));
		}
		const rate = { experience, specialist, value };
		const travellerRating = await ItineraryModel.findOneAndUpdate(
			{ _id: itineraryRef },
			{ rating: rate },
			{ new: true },
		);

		return resolve(ResponseUtility.SUCCESS({
			message: 'Rating added successfully',
			data: { rating: travellerRating.rating },
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
