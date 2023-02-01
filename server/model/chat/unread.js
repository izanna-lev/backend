/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import {
	ChannelToUserModel,
} from '../../schemas';

export default ({
	id,
}) => new Promise(async (resolve, reject) => {
	try {
		const [unreadMessage] = await ChannelToUserModel.aggregate([
			{
				$match: {
					userRef: Types.ObjectId(id),
				},
			},
			{
				$lookup: {
					from: 'messages',
					let: {
						channelRef: '$channelRef',
						lastMessageReadAt: '$lastMessageReadAt',
						userRef: '$userRef',
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$channelRef', '$$channelRef'] },
										{ $ne: ['$userRef', '$$userRef'] },
										{ $gt: ['$createdOn', '$$lastMessageReadAt'] },
									],
								},
							},
						},
					],
					as: 'unseenMessages',
				},
			},
			{
				$sort: { 'message.createdOn': -1 },
			},
			{
				$addFields: {
					unseenMessages: { $size: '$unseenMessages' },
				},
			},
			{
				$group: {
					_id: null,
					totalUnreadMessages: { $sum: '$unseenMessages' },
				},
			},
		]);
		return resolve(ResponseUtility.SUCCESS({ data: unreadMessage.totalUnreadMessages }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
