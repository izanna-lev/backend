/* eslint-disable max-len */
/* eslint-disable no-plusplus */
/* eslint-disable no-undef */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';

import {
	ItineraryModel, SpecialistModel, AdminModel,
} from '../../schemas';
/**
* @description service model function to fetch list of days in itinerary.
* @param {String} itineraryRef the unique _id of the specialist.
* @author Pavleen Kaur
*/

export default ({
	id,
	type,
	itineraryRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!itineraryRef) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property itineraryRef!' }));
		}
		// const { zone } = type === 'specialist' ? await SpecialistModel.findOne({ _id: id }) : await AdminModel.findOne({ _id: id });
		const { fromDate, toDate } = await ItineraryModel.findOne({ _id: itineraryRef });
		let duration;
		const calculateDay = (new Date(new Date(toDate).toLocaleString('en-US')).getTime() - new Date(new Date(fromDate).toLocaleString('en-US')).getTime()) / (1000 * 3600 * 24);
		if ((new Date(new Date(toDate).toLocaleString('en-US')).getTime() - new Date(new Date(fromDate).toLocaleString('en-US')).getTime()) / (1000 * 3600 * 24) === 0) {
			duration = 1;
		} else {
			duration = calculateDay + 1;
		}
		const itineraryDatesArray = [];
		for (let i = 1; i <= duration; i++) {
			const day = i;
			itineraryDatesArray.push(day);
		}
		return resolve(ResponseUtility.SUCCESS({ data: itineraryDatesArray }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
