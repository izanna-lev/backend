/* eslint-disable no-underscore-dangle */
/* eslint-disable no-async-promise-executor */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ITINERARY_STATUS, TYPE_OF_NOTIFICATIONS } from '../../constants';
import {
	ItineraryModel, NotificationModel, SpecialistModel, TravellerModel,
} from '../../schemas';
import { FirebaseNotificationService } from '../../services';
/**
* @description service model function to handle the submission of itinerary.
* @param {String} itineraryRef the unique _id of the itinerary.
* @author Pavleen Kaur
* @since 19 August, 2022
*/

export default ({
	id,
	itineraryRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!itineraryRef) {
			reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property itineraryRef!' }));
		}
		const [checkItinerary] = await ItineraryModel.aggregate([
			{ $match: { _id: Types.ObjectId(itineraryRef) } },
			{
				$lookup: {
					from: 'transportations',
					let: { itineraryRef: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$itineraryRef', '$$itineraryRef'] },
										{ $eq: ['$deleted', false] },
									],
								},
							},
						},

					],
					as: 'transportation',
				},
			},
			{ $unwind: { path: '$transportation', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'reservations',
					let: { itineraryRef: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$itineraryRef', '$$itineraryRef'] },
										{ $eq: ['$deleted', false] },
									],
								},
							},
						},

					],
					as: 'reservation',
				},
			},
			{ $unwind: { path: '$reservation', preserveNullAndEmptyArrays: true } },
			{
				$lookup: {
					from: 'notes',
					let: { itineraryRef: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$itineraryRef', '$$itineraryRef'] },
										{ $eq: ['$deleted', false] },
									],
								},
							},
						},

					],
					as: 'note',
				},
			},
			{ $unwind: { path: '$note', preserveNullAndEmptyArrays: true } },
			{
				$project: {
					itineraryStatus: '$itineraryStatus',
					allowSubmit: {
						$cond: [{
							$eq: [{
								$and: [
									{ $not: '$transportation' },
									{ $not: '$reservation' },
									{ $not: '$note' },
								],
							}, true],
						}, false, true],
					},
				},
			},
		]);
		if (checkItinerary.itineraryStatus !== ITINERARY_STATUS.PENDING) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Only pending itineraries can be submitted!' }));
		}
		if (checkItinerary.allowSubmit === false) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'You cannot submit an itinerary without any enteries!' }));
		}
		const itinerary = await ItineraryModel.findOneAndUpdate(
			{ _id: itineraryRef },
			{ itineraryStatus: ITINERARY_STATUS.UPCOMING },
			{ new: true },
		);
		const specialist = await SpecialistModel.findOne({ _id: itinerary.specialistRef });
		const notification = await NotificationModel({
			userRef: itinerary.travellerRef,
			type: TYPE_OF_NOTIFICATIONS.ITINERARY_SUBMITTED,
			sourceRef: itinerary._id,
			image: itinerary.image,
			notificationFrom: id,
			text: `${specialist ? specialist.name : 'Admin'} has created your ${itinerary.location.location} itinerary`,
		});
		await notification.save();
		const traveller = await TravellerModel.findOne({ _id: itinerary.travellerRef });
		if (traveller.fcmToken && traveller.device) {
			await FirebaseNotificationService({
				deviceTokens: [traveller.fcmToken],
				device: traveller.device,
				type: TYPE_OF_NOTIFICATIONS.ITINERARY_SUBMITTED,
				body: notification.text,
				payload: {
					body: notification.text,
					notificationFrom: id,
					userRef: traveller._id,
					itineraryRef: itinerary._id,
				},
				reference: notification._id,
				title: 'Onsite',
			});
		}
		return resolve(ResponseUtility.SUCCESS({ message: 'Itinerary Submitted Successfully!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
