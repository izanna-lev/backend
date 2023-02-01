/* eslint-disable max-len */
/* eslint-disable no-plusplus */
/* eslint-disable no-undef */
/* eslint-disable import/named */
import {
	ResponseUtility, PropsValidationUtility, SchemaMapperUtility,
} from 'appknit-backend-bundle';
import { NODE_ENV } from '../../constants';
import {
	ItineraryModel, ItineraryRequestModel,
} from '../../schemas';
import { ImageUploadUtility } from '../../utility';
/**
* @description service model function to handle the creation of itinerary.
* @param {String} id the unique _id of the specialist.
* @param {String} name the name of the itinerary.
* @param {Number} itineraryType the type of the itinerary.
* @param {Number} price the price of the itinerary.
* @param {String} specialistNote the specialistNote of the itinerary.
* @param {String} specificRestrictionsAndRegulations the additional information of the itinerary.
* @param {Date} fromDate the start date of the itinerary.
* @param {Date} toDate the end date of the itinerary.
* @param {Number} plannedTraveller the planning of the traveller for the itinerary.
* @param {Object} location as per traveller request form.
* @param {Number} guests the no. of guests travelling.
* @param {Number} rooms the no. of rooms alloted.
* @param {Number} duration the no. of days of the itinerary.
* @param {Boolean} isPassport the passport required or not for the itinerary.
* @param {Boolean} isDrivingLicense the driving license required or not for the itinerary.
* @author Pavleen Kaur
* @since 6 August, 2022
*/

export default ({
	name,
	itineraryEmail,
	formRef,
	itineraryType,
	specialistNote,
	specificRestrictionsAndRegulations,
	fromDate,
	toDate,
	price,
	image,
	location,
	rooms,
	isPassport,
	isDrivingLicense,
}) => new Promise(async (resolve, reject) => {
	try {
		const { code, message } = await PropsValidationUtility({
			validProps: ['name', 'itineraryType', 'specialistNote',
				'fromDate', 'toDate', 'price', 'specificRestrictionsAndRegulations',
				'location', 'rooms', 'isPassport', 'isDrivingLicense', 'formRef',
				'image', 'itineraryEmail',
			],
			sourceDocument: {
				name,
				itineraryEmail,
				formRef,
				itineraryType,
				specialistNote,
				specificRestrictionsAndRegulations,
				fromDate,
				toDate,
				price,
				image,
				location,
				rooms,
				isPassport,
				isDrivingLicense,
			},
		});

		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}
		let imageName;
		if (image) {
			imageName = `${NODE_ENV}-itineraryImage-${Date.now()}`;
			await ImageUploadUtility(imageName, image);
		}
		const form = await ItineraryRequestModel.findOne({ _id: formRef });
		let duration;
		const calculateDay = (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24);
		if ((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24) === 0) {
			duration = 1;
		} else {
			duration = calculateDay + 1;
		}
		const add = {
			name,
			itineraryEmail,
			itineraryType,
			specialistNote,
			specificRestrictionsAndRegulations,
			fromDate,
			toDate,
			plannedTraveller: form.plannedTraveller,
			price,
			image: imageName,
			duration,
			guests: form.travellers,
			location,
			rooms,
			isPassport,
			isDrivingLicense,
		};
		const updateItinerary = await SchemaMapperUtility(add);
		const itinerary = await ItineraryModel.findOneAndUpdate(
			{ formRef },
			updateItinerary,
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({ data: itinerary }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
