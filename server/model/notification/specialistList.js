/* eslint-disable import/named */
/**
* @author Abhinav Sharma
* @since 10 March 2021
 */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { LATEST_LIMIT } from '../../constants';
import { NotificationModel } from '../../schemas';

export default ({
	id,
}) => new Promise(async (resolve, reject) => {
	try {
		const data = await NotificationModel.aggregate([
			{
				$match: {
					userRef: Types.ObjectId(id),
				},
			},
			{
				$sort: {
					createdOn: -1,
				},
			},
			{ $limit: LATEST_LIMIT },
		]);
		const total = data.some(notification => notification.seen === false);
		return resolve(ResponseUtility.SUCCESS({ data: { list: data, totalUnread: total } }));
	} catch (error) {
		return reject(ResponseUtility.GENERIC_ERR({ message: error.message, error }));
	}
});
