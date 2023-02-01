/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility, SchemaMapperUtility,
} from 'appknit-backend-bundle';

import {
	TransportationModel,
} from '../../schemas';
import {
	 TRANSPORTATION_TYPE,
} from '../../constants';
import { DatesHandlerService } from '../../services';

/**
* @description service model function to edit a car.
* @param {String} transportationRef the _id of the transportation.
* @param {Number} day the flight belongs to which day of the itinerary(depart day).
* @param {Object} pickup the traveller pickup location.
* @param {Object} dropoff the traveller dropoff location.
* @param {Date} departDateTime the date of the pickup.
* @param {Number} transportationType the type of transportation.
* @param {Object} userCarDetails the object for user car details
* (no of travellers, carImage, nameOfDriver).
* @author Pavleen Kaur
* @since 27 August, 2022
*/

export default ({
	transportationRef,
	day,
	depart,
	arrival,
	departDateTime,
	specialistNote,
	userCarDetails,
}) => new Promise(async (resolve, reject) => {
	try {
		if (userCarDetails) {
			if (!userCarDetails.noOfTravellers || !userCarDetails.driverName) {
				return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing either noOfTravellers & driverName' }));
			}
		}
		if (!transportationRef) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing prop transportationRef!' }));
		}
		const findTransportation = await TransportationModel.findOne({ _id: transportationRef });
		if (!findTransportation) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Transportation not found!' }));
		}
		// To Handle and Allow dates between the range of fromDate and toDate of the itinerary
		const validDate = await DatesHandlerService.datesHandler(
			findTransportation.itineraryRef, departDateTime,
		);
		if (validDate === false) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'The dates you entered do not lie in the range of itinerary dates! ' }));
		}
		if (day) {
			await DatesHandlerService.negativeHandler(day);
		}
		const transportation = await SchemaMapperUtility({
			day,
			depart,
			arrival,
			departDateTime,
			specialistNote,
			transportationType: TRANSPORTATION_TYPE.CAR,
			userCarDetails,
		});
		const updatedCar = await TransportationModel.findOneAndUpdate(
			{ _id: transportationRef },
			transportation,
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({
			message: 'Car Edited Successfully!',
			data: updatedCar,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
