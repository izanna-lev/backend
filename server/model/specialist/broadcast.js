/* eslint-disable no-await-in-loop */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
	TravellerModel, NotificationModel, SpecialistModel,
} from '../../schemas';
import { TYPE_OF_NOTIFICATIONS } from '../../constants';
import { FirebaseNotificationService } from '../../services';

export default ({
	id,
	message,
	userIds = [],
}) => new Promise(async (resolve, reject) => {
	try {
		const specialist = await SpecialistModel.findOne({ _id: id });
		if (!message) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing property message' }));
		}
		const findTraveller = { fcmToken: { $ne: '' }, device: { $ne: '' } };
		if (userIds.length) {
			findTraveller._id = { $in: userIds.map(ids => Types.ObjectId(ids)) };
		}
		const travellerList = await TravellerModel.find(findTraveller);
		if (!travellerList.length) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No valid travellers present for notifications' }));
		}

		if (travellerList) {
			for (let i = 0; i < travellerList.length; i += 1) {
				const notificationCount = await NotificationModel.find(
					{ userRef: travellerList[i]._id, seen: false },
				).count();

				const payload = {
					type: TYPE_OF_NOTIFICATIONS.ADMIN,
					body: message.trim(),
					title: 'Onsite',
					reference: new ObjectId(),
					webUser: [],
				};

				if (travellerList[i].fcmToken !== '' && travellerList[i].device !== '') {
					await FirebaseNotificationService({
						deviceTokens: travellerList[i].fcmToken,
						badge: notificationCount,
						device: travellerList[i].device,
						...payload,
						payload,
					});
				}
			}
		}
		return resolve(ResponseUtility.SUCCESS({ message: 'Notifications sent successfully!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ error: err, message: err.message }));
	}
});
