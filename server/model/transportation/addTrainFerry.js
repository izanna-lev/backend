/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility, PropsValidationUtility,
} from 'appknit-backend-bundle';

import {
	TransportationModel, TicketModel,
} from '../../schemas';
import {
	TRANSPORTATION_TYPE,
} from '../../constants';
import { DatesHandlerService } from '../../services';

/**
* @description service model function to add a train/ferry.
* @param {String} itineraryRef the _id of the itinerary.
* @param {Number} day the flight belongs to which day of the itinerary(depart day).
* @param {Number} trainClass the class of the train/ferry.
* @param {Object} depart the location of the train/ferry departure.
* @param {Object} arrival the location of the train/ferry arrival.
* @param {Date} departDateTime the date  & time of the train/ferry departure.
* @param {Date} arrivalDateTime the date & time of the train/ferry arrival.
* @param {Number} transportationType the type of transportation(train/ferry).
* @param {Array} userDetails the array of objects for user details.
* @author Pavleen Kaur
* @since 26 August, 2022
*/

export default ({
	itineraryRef,
	transportationType,
	day,
	trainClass,
	depart,
	arrival,
	departDateTime,
	arrivalDateTime,
	specialistNote,
	userDetails,
}) => new Promise(async (resolve, reject) => {
	try {
		const { code, message } = await PropsValidationUtility({
			validProps: ['itineraryRef', 'day', 'trainClass',
				'depart', 'arrival', 'departDateTime', 'arrivalDateTime',
				'specialistNote', 'userDetails', 'transportationType'],
			sourceDocument: {
				itineraryRef,
				day,
				trainClass,
				depart,
				arrival,
				departDateTime,
				arrivalDateTime,
				specialistNote,
				userDetails,
				transportationType,
			},
		});
		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}
		// To Handle and Allow dates between the range of fromDate and toDate of the itinerary
		const validDepartDate = await DatesHandlerService.datesHandler(itineraryRef, departDateTime);
		const validArrivalDate = await DatesHandlerService.datesHandler(itineraryRef, arrivalDateTime);
		if (validArrivalDate === false || validDepartDate === false) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'The dates you entered do not lie in the range of itinerary dates! ' }));
		}
		await DatesHandlerService.negativeHandler(day);
		const transportation = new TransportationModel({
			itineraryRef,
			day,
			trainClass,
			depart,
			arrival,
			departDateTime,
			arrivalDateTime,
			specialistNote,
			transportationType: transportationType === TRANSPORTATION_TYPE.FERRY
				? TRANSPORTATION_TYPE.FERRY : TRANSPORTATION_TYPE.TRAIN,
		});
		await transportation.save();

		userDetails.forEach(async (userDetail) => {
			const ticket = new TicketModel({
				transportationRef: transportation._id,
				image: userDetail.image,
				name: userDetail.name,
			});
			await ticket.save();
		});
		return resolve(ResponseUtility.SUCCESS({
			message: `${transportationType === TRANSPORTATION_TYPE.FERRY ? 'Ferry' : 'Train'} Added Successfully!`,
			data: transportation,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
