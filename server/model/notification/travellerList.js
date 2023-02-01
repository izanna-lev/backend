/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
/**
* This service model function is used for Traveller Notification Listing
* @param {String} userId decoded from Rownd auth token.
* @author Pavleen Kaur
* @since 10 Sept, 2022
 */

import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { NotificationModel } from '../../schemas';
import { PAGINATION_LIMIT } from '../../constants';

export default ({
	id,
	limit = PAGINATION_LIMIT,
	page = 1,
}) => new Promise(async (resolve, reject) => {
	try {
		const [notification] = await NotificationModel.aggregate([
			{
				$match: { userRef: Types.ObjectId(id) },
			},
			{
				$facet: {
					list: [
						{
							$sort: {
								createdOn: -1,
							},
						},
						{
							$skip: (page - 1) * limit,
						},
						{
							$limit: limit,
						},
					],
					unseenNotifications: [
						{
							$match: {
								seen: false,
							},
						},
						{
							$limit: 1,
						},
					],
					total: [
						{
							$count: 'count',
						},
					],
				},
			},
			{
				$unwind: {
					path: '$total',
				},
			},
			{
				$unwind: {
					path: '$unseenNotifications',
					preserveNullAndEmptyArrays: true,
				},
			},
		]);
		return resolve({
			code: 100,
			message: 'success',
			data: (notification || {}).list || [],
			unseenNotifications: !!(notification || {}).unseenNotifications,
			page,
			limit,
			size: ((notification || {}).list || []).length,
			hasMore: notification ? ((notification.total.count || false) > (((page - 1) * limit) + notification.list.length)) : false,
		});
	} catch (error) {
		return reject(ResponseUtility.GENERIC_ERR({ message: error.message, error }));
	}
});
