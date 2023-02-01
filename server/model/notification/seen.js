/* eslint-disable import/named */
/* eslint-disable linebreak-style */
import { ResponseUtility } from 'appknit-backend-bundle';
import { NotificationModel } from '../../schemas';

export default ({
	notificationRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!notificationRef) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property notificationRef!' }));
		}
		const notification = await NotificationModel.findOneAndUpdate(
			{ _id: notificationRef }, { seen: true }, { new: true },
		);
		if (!notification) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid notification!' }));
		}

		return resolve(ResponseUtility.SUCCESS({ message: 'Success!', data: notification }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
