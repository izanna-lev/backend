/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility, SchemaMapperUtility,
} from 'appknit-backend-bundle';
import { TYPE_OF_NOTIFICATIONS } from '../../constants';
import {
	ItineraryRequestModel, SpecialistModel, NotificationModel,
	BlockModel, ItineraryModel, ChannelToUserModel,
} from '../../schemas';
import { FirebaseNotificationService } from '../../services';

/**
* @description service model function to assign itinerary to a specialist.
* @param {String} specialistRef the unique _id of the specialist.
* @param {String} formRef the unique _id of the itineraryRequestForm.
* @author Pavleen Kaur
* @since 9 September, 2022
*/

export default ({
	id,
	formRef,
	specialistRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!formRef) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property formRef!' }));
		}

		const updateItineraryRequest = await SchemaMapperUtility({
			specialistRef,
		});
		const itineraryRequest = await ItineraryRequestModel.findOneAndUpdate(
			{ _id: formRef },
			updateItineraryRequest,
			{ new: true },
		);
		const itinerary = await ItineraryModel.findOne({ formRef: itineraryRequest._id });
		const checkChannel = await ChannelToUserModel.findOne(
			{ channelRef: itinerary._id, userRef: specialistRef },
		);
		if (itinerary) {
			const checkBlock = await BlockModel.findOne(
				{
					blockedBy: itineraryRequest.travellerRef,
					blockedUser: itineraryRequest.specialistRef,
					itineraryRef: itinerary._id,
				},
			);
			if (checkBlock) {
				return reject(ResponseUtility.GENERIC_ERR({ message: 'You cannot re-assign a blocked specialist!' }));
			}
			await ItineraryModel.updateOne({ _id: itinerary._id }, { specialistRef });
			if (!checkChannel) {
				const createChannelToSpecialist = new ChannelToUserModel({
					userRef: specialistRef,
					channelRef: itinerary._id,
					lastMessageReadAt: Date.now(),
					createdOn: Date.now(),
					updatedOn: Date.now(),
				});
				createChannelToSpecialist.save();
			}
		}


		const specialist = await SpecialistModel.findOne({ _id: specialistRef });
		const notification = new NotificationModel({
			userRef: specialistRef,
			type: TYPE_OF_NOTIFICATIONS.ASSIGN_SPECIALIST,
			sourceRef: formRef,
			notificationFrom: id,
			text: 'A new itinerary has been assigned to you',
		});
		await notification.save();

		if (specialist.fcmToken && specialist.device) {
			await FirebaseNotificationService({
				deviceTokens: [specialist.fcmToken],
				device: specialist.device,
				type: TYPE_OF_NOTIFICATIONS.ASSIGN_SPECIALIST,
				body: notification.text,
				payload: {
					body: notification.text,
					notificationFrom: id,
					userRef: specialistRef,
					formRef,
				},
				reference: notification._id,
			});
		}
		return resolve(ResponseUtility.SUCCESS({
			message: 'Specialist Assigned Successfully!',
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
