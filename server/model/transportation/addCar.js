/* eslint-disable no-unused-vars */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility, PropsValidationUtility,
} from 'appknit-backend-bundle';

import {
	TransportationModel,
} from '../../schemas';
import {
	TRANSPORTATION_TYPE,
} from '../../constants';
import { DatesHandlerService } from '../../services';

/**
* @description service model function to add a car.
* @param {String} itineraryRef the _id of the itinerary.
* @param {Number} day the flight belongs to which day of the itinerary(depart day).
* @param {Object} depart(pickup) the traveller pickup location.
* @param {Object} arrival(dropoff) the traveller dropoff location.
* @param {Date} departDateTime the date of the flight arrival.
* @param {Number} transportationType the type of transportation.
* @param {Object} userCarDetails the object for user car details
* (no of travellers, carImage, nameOfDriver).
* @author Pavleen Kaur
* @since 27 August, 2022
*/

export default ({
	itineraryRef,
	day,
	depart,
	arrival,
	departDateTime,
	specialistNote,
	userCarDetails,
}) => new Promise(async (resolve, reject) => {
	try {
		const { carImage, noOfTravellers, driverName } = userCarDetails;
		const { code, message } = await PropsValidationUtility({
			validProps: ['itineraryRef', 'day', 'departDateTime',
				'depart', 'arrival', 'specialistNote',
				'noOfTravellers', 'driverName'],
			sourceDocument: {
				itineraryRef,
				day,
			    depart,
				arrival,
				departDateTime,
				specialistNote,
		        noOfTravellers,
				driverName,
			},
		});
		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}
		// To Handle and Allow dates between the range of fromDate and toDate of the itinerary
		const validDate = await DatesHandlerService.datesHandler(itineraryRef, departDateTime);
		if (validDate === false) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'The dates you entered do not lie in the range of itinerary dates! ' }));
		}
		await DatesHandlerService.negativeHandler(day);
		const transportation = new TransportationModel({
			itineraryRef,
			day,
			depart,
			arrival,
			departDateTime,
			specialistNote,
			transportationType: TRANSPORTATION_TYPE.CAR,
			userCarDetails,
		});
		await transportation.save();

		return resolve(ResponseUtility.SUCCESS({
			message: 'Car Added Successfully!',
			data: transportation,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
