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
		const ios = [];
		const android = [];
		if (travellerList) {
			travellerList.forEach(async (user) => {
				if (user.device === 'ios' || user.device === 'iOS') {
					ios.push(user.fcmToken);
			    }
			    if (user.device === 'android') {
					android.push(user.fcmToken);
			    }
				const notification = new NotificationModel({
					userRef: user._id,
					type: TYPE_OF_NOTIFICATIONS.SPECIALIST,
					image: specialist.image,
					notificationFrom: id,
					text: message,
				});
				await notification.save();
			});

			const payload = {
				type: TYPE_OF_NOTIFICATIONS.SPECIALIST,
				image: specialist.image,
				body: message.trim(),
				title: 'Onsite',
				reference: new ObjectId(),
			};
			if (ios.length) {
				await FirebaseNotificationService({
					deviceTokens: ios,
					device: 'ios',
					...payload,
					payload,
				});
			}
			if (android.length) {
				await FirebaseNotificationService({
					deviceTokens: android,
					device: 'android',
					...payload,
					payload,
				});
			}
		}
		return resolve(ResponseUtility.SUCCESS({ message: 'Notifications sent successfully!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ error: err, message: err.message }));
	}
});
