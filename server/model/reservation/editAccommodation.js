/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility, SchemaMapperUtility,
} from 'appknit-backend-bundle';
import {
	ReservationModel,
} from '../../schemas';
import {
	NODE_ENV,
} from '../../constants';
import {
	ImageUploadUtility,
} from '../../utility';
import { DatesHandlerService } from '../../services';

/**
* @description service model function to edit an accommodation reservation.
* @param {String} name the name of the accommodation.
* @param {Number} day the accommodation reservation belongs to which day of the itinerary.
* @param {String} reservationRef the _id of the reservation.
* @param {Number} reservationType the type of reservervation(accommodation,restaurant,activity)
* @param {String} image the image of the accommodation.
* @param {Object} location the location of the accommodation.
* @param {String} contactNumber the location of the accommodation.
* @param {Date} checkInDateTime the date & time of the check in.
* @param {Date} checkOutDateTime the date & time of the check out.
* @author Pavleen Kaur
* @since 08 August, 2022
*/

export default ({
	reservationRef,
	name,
	day,
	image,
	location,
	contactNumber,
	description,
	checkInDateTime,
	checkOutDateTime,
	phoneCode,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!reservationRef) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property reservationRef!' }));
		}
		const findReservation = await ReservationModel.findOne({ _id: reservationRef });
		if (!findReservation) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Reservation not found!' }));
		}
		if (new Date(checkInDateTime) > new Date(checkOutDateTime)) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Check in date cannot be greater than check out date!' }));
		}
		// To Handle and Allow dates between the range of fromDate and toDate of the itinerary
		if (checkInDateTime || checkOutDateTime || (checkInDateTime && checkOutDateTime)) {
			if (checkInDateTime) {
				const validCheckInDate = await DatesHandlerService.datesHandler(
					findReservation.itineraryRef, checkInDateTime,
				);
				if (validCheckInDate === false) {
					return reject(ResponseUtility.GENERIC_ERR({ message: 'The date you entered do not lie in the range of itinerary dates! ' }));
				}
			} if (checkOutDateTime) {
				const validCheckInDate = await DatesHandlerService.datesHandler(
					findReservation.itineraryRef,
					checkInDateTime,
				);
				if (validCheckInDate === false) {
					return reject(ResponseUtility.GENERIC_ERR({ message: 'The date you entered do not lie in the range of itinerary dates! ' }));
				}
			} if ((checkInDateTime && checkOutDateTime)) {
				const validCheckInDate = await DatesHandlerService.datesHandler(
					findReservation.itineraryRef, checkInDateTime,
				);
				const validCheckOutDate = await DatesHandlerService.datesHandler(
					findReservation.itineraryRef, checkOutDateTime,
				);
				if (validCheckInDate === false || validCheckOutDate === false) {
					return reject(ResponseUtility.GENERIC_ERR({ message: 'The dates you entered do not lie in the range of itinerary dates! ' }));
				}
			}
		}
		await DatesHandlerService.negativeHandler(day);
		let imageName;
		if (image) {
			imageName = `${NODE_ENV}-accomodationImage-${Date.now()}`;
			await ImageUploadUtility(imageName, image);
		}
		const updateAccommodation = await SchemaMapperUtility({
			name,
			day,
			image: imageName,
			location,
			contactNumber,
			description,
			checkInDateTime,
			checkOutDateTime,
			phoneCode,
		});
		const reservation = await ReservationModel.findOneAndUpdate(
			{ _id: reservationRef },
			updateAccommodation,
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({
			message: 'Accommodation edited successfully!',
			data: reservation,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
