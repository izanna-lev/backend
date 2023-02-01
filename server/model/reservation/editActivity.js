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
* @description service model function to edit an activity reservation.
* @param {String} name the name of the Activity.
* @param {Number} day the accomodation reservation belongs to which day of the itinerary.
* @param {String} reservationRef the _id of the reservation.
* @param {Binary} image the image of the Activity.
* @param {Object} location the location of the Activity.
* @param {Date} reservationDateTime the date & time of the Activity reservation.
* @author Pavleen Kaur
* @since 12 August, 2022
*/

export default ({
	reservationRef,
	day,
	name,
	image,
	location,
	description,
	reservationDateTime,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!reservationRef) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing Property reservationRef' }));
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
			imageName = `${NODE_ENV}-activityImage-${Date.now()}`;
			await ImageUploadUtility(imageName, image);
		}
		const updateActivity = await SchemaMapperUtility({
			name,
			day,
			image: imageName,
			location,
			description,
			reservationDateTime,
		});
		const reservation = await ReservationModel.findOneAndUpdate(
			{ _id: reservationRef },
			updateActivity,
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({
			message: 'Activity edited successfully!',
			data: reservation,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
