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
* @description service model function to add a flight.
* @param {String} itineraryRef the _id of the itinerary.
* @param {Number} day the flight belongs to which day of the itinerary(depart day).
* @param {Object} airline the airline of the flight.
* @param {Number} flightClass the class of the flight.
* @param {Object} depart the location of the flight departure.
* @param {Object} arrival the location of the flight arrival.
* @param {Date} departDateTime the time & date of the flight departure.
* @param {Date} arrivalDateTime the time & date of the flight arrival.
* @param {Number} transportationType the type of transportation.
* @param {Array} userDetails the array of objects for user details.
* @author Pavleen Kaur
* @since 22 August, 2022
*/

export default ({
	itineraryRef,
	day,
	airline,
	flightClass,
	depart,
	arrival,
	departDateTime,
	arrivalDateTime,
	specialistNote,
	userDetails,
}) => new Promise(async (resolve, reject) => {
	try {
		const { code, message } = await PropsValidationUtility({
			validProps: ['itineraryRef', 'day', 'airline', 'flightClass',
				'depart', 'arrival', 'departDateTime', 'arrivalDateTime',
				'specialistNote', 'userDetails'],
			sourceDocument: {
				itineraryRef,
				day,
				airline,
				flightClass,
				depart,
				arrival,
				departDateTime,
				arrivalDateTime,
				specialistNote,
				userDetails,
			},
		});
		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}
		// To Handle and Allow dates between the range of fromDate and toDate of the itinerary
		const validArrivalDate = await DatesHandlerService.datesHandler(itineraryRef, arrivalDateTime);
		const validDepartDate = await DatesHandlerService.datesHandler(itineraryRef, departDateTime);

		if (validArrivalDate === false || validDepartDate === false) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'The dates you entered do not lie in the range of itinerary dates! ' }));
		}
		await DatesHandlerService.negativeHandler(day);
		const transportation = new TransportationModel({
			itineraryRef,
			day,
			airline,
			flightClass,
			depart,
			arrival,
			departDateTime,
			arrivalDateTime,
			specialistNote,
			transportationType: TRANSPORTATION_TYPE.FLIGHT,
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
			message: 'Flight Added Successfully!',
			data: transportation,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
