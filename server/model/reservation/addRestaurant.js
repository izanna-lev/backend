/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility, PropsValidationUtility,
} from 'appknit-backend-bundle';
import { RESERVATION_TYPE, NODE_ENV } from '../../constants';
import {
	ReservationModel,
} from '../../schemas';
import {
	ImageUploadUtility,
} from '../../utility';
import { DatesHandlerService } from '../../services';
/**
* @description service model function to add a restaurant reservation.
* @param {String} name the name of the restaurant.
* @param {Number} day the restaurant reservation belongs to which day of the itinerary.
* @param {String} itineraryRef the _id of the itinerary.
* @param {Number} reservationType the type of reservervation(hotel,restaurant,activity)
* @param {String} image the image of the restaurant.
* @param {Object} location the location of the restaurant.
* @param {String} contactNumber the location of the restaurant.
* @param {Date} reservationDateTime the date & time of the restaurant reservation.
* @author Pavleen Kaur
* @since 10 August, 2022
*/

export default ({
	itineraryRef,
	day,
	name,
	image,
	location,
	contactNumber,
	description,
	reservationDateTime,
	phoneCode,
}) => new Promise(async (resolve, reject) => {
	try {
		const { code, message } = await PropsValidationUtility({
			validProps: ['name', 'itineraryRef', 'location', 'image', 'day', 'phoneCode',
				'contactNumber', 'description', 'reservationDateTime'],
			sourceDocument: {
				name,
				day,
				image,
				itineraryRef,
				location,
				contactNumber,
				description,
				reservationDateTime,
				phoneCode,
			},
		});

		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}
		// To Handle and Allow dates between the range of fromDate and toDate of the itinerary
		const validDate = await DatesHandlerService.datesHandler(itineraryRef, reservationDateTime);
		if (validDate === false) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'The dates you entered do not lie in the range of itinerary dates! ' }));
		}
		await DatesHandlerService.negativeHandler(day);
		let imageName;
		if (image) {
			imageName = `${NODE_ENV}-restaurantImage-${Date.now()}`;
			await ImageUploadUtility(imageName, image);
		}
		const reservation = new ReservationModel({
			name,
			day,
			image: imageName,
			itineraryRef,
			reservationType: RESERVATION_TYPE.RESTAURANT,
			location,
			contactNumber,
			description,
			reservationDateTime,
			phoneCode,
		});
		await reservation.save();
		return resolve(ResponseUtility.SUCCESS({
			message: 'Restaurant added successfully!',
			data: reservation,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
