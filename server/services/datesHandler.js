/* eslint-disable radix */
/* eslint-disable consistent-return */
/* eslint-disable import/named */
/* eslint-disable no-plusplus */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */

import { ResponseUtility } from 'appknit-backend-bundle';
import { ItineraryModel } from '../schemas';

/**
 * @description service module to handle and allow dates between the range of fromDate and toDate.
 * @author Pavleen Kaur
 */

// @desc- Reservation and transportation dates should lie between itinerary dates
// @param - reference - ObjectId, date- Date
const datesHandler = (reference, date) => new Promise(async (_resolve, _reject) => {
	try {
		const { fromDate, toDate } = await ItineraryModel.findOne({ _id: reference });
		console.log('fromDate', new Date(fromDate).getTime());
		console.log('toDate', new Date(toDate).getTime());
		let duration;
		const calculateDay = (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24);
		if ((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24) === 0) {
			duration = 1;
		} else {
			duration = calculateDay + 1;
		}
		console.log('calculateDay', calculateDay);
		const itineraryDatesArray = [];
		let itineraryDates;
		for (let i = 0; i < duration; i++) {
			itineraryDates = new Date(new Date(fromDate).setDate(new Date(fromDate).getDate() + i)).toLocaleDateString('en-US');
			itineraryDatesArray.push(itineraryDates);
		}
		console.log('itineraryDatesArray', itineraryDatesArray);
		console.log('checkDate', new Date(date).toLocaleDateString('en-US'));
		const dateFound = itineraryDatesArray.find(checkDate => checkDate === new Date(date).toLocaleDateString('en-US'));
		let status = false;
		if (!dateFound) {
			status = false;
		} else {
			status = true;
		}
		return _resolve(status);
	} catch (err) {
		return 'error';
	}
});
// @desc - Day Cannot be negative
// @param - day - Number
const negativeHandler = day => new Promise(async (_resolve, _reject) => {
	try {
		if (parseInt(day) !== Math.abs(parseInt(day))) {
			return _reject(ResponseUtility.GENERIC_ERR({ message: 'Day cannot be negative!' }));
		}
		return _resolve();
	} catch (err) {
		return 'error';
	}
});
export default{
	datesHandler,
	negativeHandler,
};
