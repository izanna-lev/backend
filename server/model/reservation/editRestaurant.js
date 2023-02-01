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
* @description service model function to edit a restaurant reservation.
* @param {String} name the name of the restaurant.
* @param {Number} day the accomodation reservation belongs to which day of the itinerary.
* @param {String} reservationRef the _id of the reservation.
* @param {String} image the image of the restaurant.
* @param {Object} location the location of the restaurant.
* @param {String} contactNumber the location of the restaurant.
* @param {Date} reservationDateTime the date & time of the restaurant reservation.
* @author Pavleen Kaur
* @since 10 August, 2022
*/

export default ({
	reservationRef,
	day,
	name,
	image,
	location,
	contactNumber,
	description,
	reservationDateTime,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!reservationRef) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing Property reservationRef' }));
		}
		if ((!day && reservationDateTime) || (day && !reservationDateTime)) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Provide both day and reservationDateTime' }));
		}
		const findReservation = await ReservationModel.findOne({ _id: reservationRef });
		if (!findReservation) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Reservation not found!' }));
		}
		if (reservationDateTime) {
			// To Handle and Allow dates between the range of fromDate and toDate of the itinerary
			const validDate = await DatesHandlerService.datesHandler(
				findReservation.itineraryRef, reservationDateTime,
			);
			if (validDate === false) {
				return reject(ResponseUtility.GENERIC_ERR({ message: 'The dates you entered do not lie in the range of itinerary dates! ' }));
			}
		}
		await DatesHandlerService.negativeHandler(day);
		let imageName;
		if (image) {
			imageName = `${NODE_ENV}-restaurantImage-${Date.now()}`;
			await ImageUploadUtility(imageName, image);
		}
		const updateRestaurant = await SchemaMapperUtility({
			name,
			day,
			image: imageName,
			location,
			contactNumber,
			description,
			reservationDateTime,
		});
		const reservation = await ReservationModel.findOneAndUpdate(
			{ _id: reservationRef },
			updateRestaurant,
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({
			message: 'Restaurant edited successfully!',
			data: reservation,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
