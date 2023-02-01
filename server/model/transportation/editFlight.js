/* eslint-disable no-await-in-loop */
/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility, SchemaMapperUtility,
} from 'appknit-backend-bundle';

import {
	TransportationModel, TicketModel,
} from '../../schemas';
import {
	TRANSPORTATION_TYPE,
} from '../../constants';
import { DatesHandlerService } from '../../services';

/**
* @description service model function to edit a flight.
* @param {String} transportationRef the _id of the flight.
* @param {Number} day the flight belongs to which day of the itinerary(depart day).
* @param {Object} airline the airline of the flight.
* @param {Number} flightClass the class of the flight.
* @param {Object} depart the location of the flight departure.
* @param {Object} arrival the location of the flight arrival.
* @param {Date} departDateTime the date & time of the flight departure.
* @param {Date} arrivalDateTime the date & time of the flight arrival.
* @param {Number} transportationType the type of transportation.
* @param {Array} userDetails the array of objects for user details.
* @author Pavleen Kaur
* @since 22 August, 2022
*/

export default ({
	transportationRef,
	day,
	airline,
	flightClass,
	depart,
	arrival,
	departDateTime,
	arrivalDateTime,
	specialistNote,
	userDetails,
	deleteUserDetails,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!transportationRef) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing property transportationRef!' }));
		}
		if (userDetails) {
			for (let i = 0; i < userDetails.filter(userDetail => userDetail).length; i += 1) {
				if (!userDetails[i].name || !userDetails[i].image) {
					return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing either ticket image or name!' }));
				}
			}
		}
		const findTransportation = await TransportationModel.findOne({ _id: transportationRef });
		if (!findTransportation) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Transportation not found!' }));
		}

		// To Handle and Allow dates between the range of fromDate and toDate of the itinerary
		if (departDateTime || arrivalDateTime || (departDateTime && arrivalDateTime)) {
			if (departDateTime) {
				const validDepartDate = await DatesHandlerService.datesHandler(
					findTransportation.itineraryRef, departDateTime,
				);
				if (validDepartDate === false) {
					return reject(ResponseUtility.GENERIC_ERR({ message: 'The date you entered do not lie in the range of itinerary dates! ' }));
				}
			} if (arrivalDateTime) {
				const validArrivalDate = await DatesHandlerService.datesHandler(
					findTransportation.itineraryRef, arrivalDateTime,
				);
				if (validArrivalDate === false) {
					return reject(ResponseUtility.GENERIC_ERR({ message: 'The date you entered do not lie in the range of itinerary dates! ' }));
				}
			} if (departDateTime && arrivalDateTime) {
				const validDepartDate = await DatesHandlerService.datesHandler(
					findTransportation.itineraryRef, departDateTime,
				);
				const validArrivalDate = await DatesHandlerService.datesHandler(
					findTransportation.itineraryRef, arrivalDateTime,
				);
				if (validDepartDate === false || validArrivalDate === false) {
					return reject(ResponseUtility.GENERIC_ERR({ message: 'The dates you entered do not lie in the range of itinerary dates! ' }));
				}
			}
		}
		if (day) {
			await DatesHandlerService.negativeHandler(day);
		}

		const updateFlight = await SchemaMapperUtility({
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

		const updatedFlight = await TransportationModel.findOneAndUpdate(
			{ _id: transportationRef },
			updateFlight,
			{ new: true },
		);
		if (userDetails) {
			userDetails.forEach(async (userDetail) => {
				const ticket = new TicketModel({
					transportationRef: updatedFlight._id,
					name: userDetail.name,
					image: userDetail.image,
				});
				await ticket.save();
			});
		}
		if (deleteUserDetails) {
			for (let i = 0; i < deleteUserDetails.length; i += 1) {
				await TicketModel.findOneAndUpdate({ _id: deleteUserDetails[i] }, { deleted: true });
			}
		}
		return resolve(ResponseUtility.SUCCESS({
			message: 'Flight Edited Successfully!',
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
