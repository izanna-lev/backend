/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable space-infix-ops */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable import/named */
import {
	ResponseUtility, SchemaMapperUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ITINERARY_STATUS, NODE_ENV, TYPE_OF_NOTIFICATIONS } from '../../constants';
import {
	ItineraryModel, NotificationModel,
} from '../../schemas';
import { ImageUploadUtility } from '../../utility';
import { FirebaseNotificationService } from '../../services';

/**
* @description service model function to handle the editing of itinerary.
* @param {String} id the unique _id of the specialist.
* @param {String} itineraryRef the unique _id of the itinerary.
* @param {String} itineraryEmail the unique _id of the itinerary.
* @param {String} name the name of the itinerary.
* @param {Number} itineraryType the type of the itinerary.
* @param {Number} price the price of the itinerary.
* @param {String} specialistNote the specialistNote of the itinerary.
* @param {String} specificRestrictionsAndRegulations the additional information of the itinerary.
* @param {Date} fromDate the start date of the itinerary.
* @param {Date} toDate the end date of the itinerary.
* @param {Number} plannedTraveller the planning of the traveller for the itinerary.
* @param {Number} guests the no. of guests travelling.
* @param {Number} rooms the no. of rooms alloted.
* @param {Number} duration the no. of days of the itinerary.
* @param {Number} location as per trip request form.
* @param {Boolean} isPassport the passport required or not for the itinerary.
* @param {Boolean} isDrivingLicense the driving license required or not for the itinerary.
* @author Pavleen Kaur
* @since 13 August, 2022
*/

export default ({
	id,
	itineraryRef,
	name,
	itineraryEmail,
	itineraryType,
	specialistNote,
	specificRestrictionsAndRegulations,
	fromDate,
	toDate,
	plannedTraveller,
	price,
	image,
	location,
	guests,
	rooms,
	isPassport,
	isDrivingLicense,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!itineraryRef) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property itineraryRef!' }));
		}
		let imageName;
		if (image) {
			imageName = `${NODE_ENV}-itineraryImage-${Date.now()}`;
			await ImageUploadUtility(imageName, image);
		}
		let duration;
		const calculateDay = (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24);
		if ((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24) === 0) {
			duration = 1;
		} else {
			duration = calculateDay + 1;
		}
		const update = {
			name,
			itineraryEmail,
			itineraryType,
			specialistNote,
			specificRestrictionsAndRegulations,
			fromDate,
			toDate,
			plannedTraveller,
			price,
			location,
			image: imageName,
			duration: (!fromDate && !toDate) || (!fromDate) || (!toDate) ? undefined: duration,
			guests,
			rooms,
			isPassport,
			isDrivingLicense,
		};
		const updateItinerary = await SchemaMapperUtility(update);
		const itinerary = await ItineraryModel.findOneAndUpdate(
			{ _id: itineraryRef },
			updateItinerary,
			{ new: true },
		);
		const [data] = await ItineraryModel.aggregate([
			{ $match: { _id: Types.ObjectId(itineraryRef) } },
			{
				$lookup: {
					from: 'travellers',
					let: { travellerRef: '$travellerRef' },
					pipeline: [{
						$match: {
							$expr: {
								$and: [
									{ $eq: ['$_id', '$$travellerRef'] },
								],
							},
						},
					}],
					as: 'traveller',
				},
			},
			{ $unwind: { path: '$traveller', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'specialists',
					let: { specialistRef: '$specialistRef' },
					pipeline: [{
						$match: {
							$expr: {
								$and: [
									{ $eq: ['$_id', '$$specialistRef'] },
								],
							},
						},
					},
					],
					as: 'specialist',
				},
			},
			{ $unwind: { path: '$specialist', preserveNullAndEmptyArrays: true } },
		]);
		const notification = await NotificationModel({
			userRef: data.travellerRef,
			type: TYPE_OF_NOTIFICATIONS.ITINERARY_EDITED,
			notificationFrom: id,
			sourceRef: data._id,
			image: data.image,
			text: 'Your itinerary has been updated',
		});
		await notification.save();

		if (data.traveller.fcmToken && data.traveller.device) {
			await FirebaseNotificationService({
				deviceTokens: [data.traveller.fcmToken],
				device: data.traveller.device,
				type: TYPE_OF_NOTIFICATIONS.ITINERARY_EDITED,
				body: notification.text,
				payload: {
					body: notification.text,
					notificationFrom: id,
					userRef: data.traveller._id,
					itineraryRef: data._id,
				},
				title: 'Onsite',
			});
		}
		return resolve(ResponseUtility.SUCCESS({
			message: 'Itinerary Edited Successfully!',
			data: itinerary,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
