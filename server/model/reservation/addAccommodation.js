/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility, PropsValidationUtility,
} from 'appknit-backend-bundle';
import { DatesHandlerService } from '../../services';
import {
	ReservationModel,
} from '../../schemas';
import {
	RESERVATION_TYPE, NODE_ENV,
} from '../../constants';
import {
	ImageUploadUtility,
} from '../../utility';
/**
* @description service model function to add a accommodation reservation.
* @param {String} name the name of the accommodation.
* @param {Number} day the accommodation reservation belongs to which day of the itinerary.
* @param {String} itineraryRef the _id of the itinerary.
* @param {Number} reservationType the type of reservation(accommodation,restaurant,activity)
* @param {String} image the image of the accommodation.
* @param {Object} location the location of the accommodation.
* @param {String} contactNumber the location of the accommodation.
* @param {Date} checkInDate the date & time of the check in.
* @param {Date} checkOutTime the date & time of the check out.
* @author Pavleen Kaur
* @since 08 August, 2022
*/

export default ({
	itineraryRef,
	day,
	name,
	image,
	location,
	contactNumber,
	description,
	checkInDateTime,
	checkOutDateTime,
	phoneCode,

}) => new Promise(async (resolve, reject) => {
	try {
		const { code, message } = await PropsValidationUtility({
			validProps: ['name', 'itineraryRef', 'location', 'image', 'day',
				'contactNumber', 'description', 'checkInDateTime', 'phoneCode',
				'checkOutDateTime'],
			sourceDocument: {
				name,
				image,
				day,
				itineraryRef,
				location,
				contactNumber,
				description,
				checkInDateTime,
				checkOutDateTime,
				phoneCode,
			},
		});
		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}
		// To Handle and Allow dates between the range of fromDate and toDate of the itinerary
		const validCheckInDate = await DatesHandlerService.datesHandler(itineraryRef, checkInDateTime);
		const validCheckOutDate = await DatesHandlerService.datesHandler(
			itineraryRef, checkOutDateTime,
		);
		if (validCheckInDate === false || validCheckOutDate === false) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'The dates you entered do not lie in the range of itinerary dates! ' }));
		}
		await DatesHandlerService.negativeHandler(day);
		let imageName;
		if (image) {
			imageName = `${NODE_ENV}-accommodationImage-${Date.now()}`;
			await ImageUploadUtility(imageName, image);
		}
		const reservation = new ReservationModel({
			name,
			day,
			image: imageName,
			itineraryRef,
			reservationType: RESERVATION_TYPE.ACCOMMODATION,
			location,
			contactNumber,
			description,
			checkInDateTime,
			checkOutDateTime,
			phoneCode,
		});
		await reservation.save();
		return resolve(ResponseUtility.SUCCESS({
			message: 'Accommodation added successfully!',
			data: reservation,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
