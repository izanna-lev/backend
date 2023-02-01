/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-undef */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { ITINERARY_STATUS } from '../../constants';
import {
	ReportModel, ItineraryModel,
} from '../../schemas';

/**
* @description service model function to handle the adding of Report.
* @param {String} specialistRef the unique _id of the specialist.
* @param {String} reason the reason of report.
*/

export default ({
	id,
	specialistRef,
	reason,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!specialistRef || !reason) {
			return reject(ResponseUtility.GENERIC_ERR({ message: `Missing property ${specialistRef ? 'reason' : 'specialistRef'}.` }));
		}
		const itinerary = await ItineraryModel.findOne({ specialistRef });
		if (itinerary.itineraryStatus === ITINERARY_STATUS.COMPLETED) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'You cannot report on a completed trip!' }));
		}
		const report = new ReportModel({
			reportedBy: id,
	        reportedUser: specialistRef,
	        reason,
		});
		await report.save();
		return resolve(ResponseUtility.SUCCESS({
			message: 'Specialist reported successfully',
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
