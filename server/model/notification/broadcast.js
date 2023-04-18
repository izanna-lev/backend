/* eslint-disable no-await-in-loop */
/* eslint-disable no-unused-vars */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import {
	TravellerModel, SpecialistModel, NotificationModel,
} from '../../schemas';
import { TYPE_OF_NOTIFICATIONS, USER_FILTER } from '../../constants';
import { FirebaseNotificationService } from '../../services';

/**
* @description A service model function to publish a notification in system.
* @author Abhinav Sharma
* @since 10 March 2021
*/

export default ({
	id,
	message,
	userIds = [],
	selectedAll,
	userType,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!message) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing property message' }));
		}
		const lookupQuery = {
			deleted: false,
			blocked: false,
			fcmToken: { $ne: '' },
			device: { $ne: '' },
		};
		if (userIds.length) {
			lookupQuery._id = { $in: userIds.map(Types.ObjectId) };
		}
		let traveller;
		let specialist;
		if (userType !== USER_FILTER.SPECIALIST) {
			traveller = await TravellerModel.find(lookupQuery);
		}
		if (userType !== USER_FILTER.TRAVELLER) {
			specialist = await SpecialistModel.find(lookupQuery);
		}
		const users = [...traveller || [], ...specialist || []];
		if (!users.length) {
			return reject(ResponseUtility.GENERIC_ERR(
				{ message: 'No valid users present for notifications' },
			));
		}

		const webUser = [];
		if (users) {
			for (let i = 0; i < users.length; i += 1) {
				const notification = new NotificationModel({
					userRef: users[i]._id,
					type: TYPE_OF_NOTIFICATIONS.ADMIN,
					notificationFrom: id,
					text: message,
				});

				await notification.save();

				const notificationCount = await NotificationModel.find(
					{ userRef: users[i]._id, seen: false },
				).count();

				const payload = {
					type: TYPE_OF_NOTIFICATIONS.ADMIN,
					body: message.trim(),
					title: 'Onsite',
					reference: new ObjectId(),
					webUser: webUser || [],
				};

				if (users[i].fcmToken !== '' && users[i].device !== '') {
					await FirebaseNotificationService({
						deviceTokens: [users[i].fcmToken],
						badge: notificationCount,
						device: users[i].device,
						type: payload.type,
						title: payload.title,
						payload,
					});
				}
			}
		}
		return resolve(ResponseUtility.SUCCESS({ message: 'All Notifications were sent successfully' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ error: err, message: err.message }));
	}
});
