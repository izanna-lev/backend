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
	type,
	page = 1,
	limit = 30,
	all,
}) => new Promise(async (resolve, reject) => {
	try {
		// console.time('testing');
		let otherUserQuery = '';
		const projectQuery = [];
		const paginationQuery = [];
		if (!all) {
			paginationQuery.push(
				{ $skip: limit * (page - 1) },
				{ $limit: limit },
			);
		}
		if (type === 'admin') {
			otherUserQuery = 'travellers';
			const project = {
				$project: {
					userRef: '$userRef',
					channelRef: '$channelRef',
					message: '$message',
					lastMessageReadAt: '$lastMessageReadAt',
					createdOn: '$createdOn',
					updatedOn: '$updatedOn',
					otherUser: {
						_id: '$otherUser._id',
						name: { $concat: ['$itinerary.itineraryrequest.firstName', ' ', '$itinerary.itineraryrequest.lastName'] },
						image: '$otherUser.image',
						deleted: '$otherUser.deleted',
					},
					unseenMessages: '$unseenMessages',
					itineraryStatus: '$itinerary.itineraryStatus',
				},
			};
			projectQuery.push(project);
		} else if (type === 'specialist') {
			otherUserQuery = 'travellers';
			const project = {
				$project: {
					userRef: '$userRef',
					channelRef: '$channelRef',
					message: '$message',
					lastMessageReadAt: '$lastMessageReadAt',
					createdOn: '$createdOn',
					updatedOn: '$updatedOn',
					otherUser: {
						_id: '$otherUser._id',
						name: { $concat: ['$itinerary.itineraryrequest.firstName', ' ', '$itinerary.itineraryrequest.lastName'] },
						image: '$otherUser.image',
						deleted: '$otherUser.deleted',
					},
					itineraryStatus: '$itinerary.itineraryStatus',
					unseenMessages: '$unseenMessages',
				},
			};
			projectQuery.push(project);
		} else if (type === 'user') {
			otherUserQuery = 'specialists';
			const project = {
				$project: {
					_id: '$itinerary._id',
					userRef: '$userRef',
					channelRef: '$channelRef',
					specialistRef: '$itinerary.specialistRef',
					specialistName: '$otherUser.name',
					adminRef: { $ifNull: ['$itinerary.adminRef', ''] },
					message: '$message',
					itineraryStatus: '$itinerary.itineraryStatus',
					fromDate: { $ifNull: ['$itinerary.fromDate', '$itinerary.itineraryrequest.plannedDate'] },
					toDate: '$itinerary.toDate',
					image: '$itinerary.image',
					location: { $ifNull: ['$itinerary.location.location', '$itinerary.itineraryrequest.location'] },
					unseenMessages: '$unseenMessages',
				},
			};
			projectQuery.push(project);
		}
		if (otherUserQuery === '') {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No User Found!' }));
		}
		const [chats] = await ChannelToUserModel.aggregate([
			{
				$match: { userRef: Types.ObjectId(id) },
			},
			{
				$lookup: {
					from: 'blocks',
					let: { itineraryRef: '$channelRef', blockedUser: Types.ObjectId(id) },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{
											$eq: ['$itineraryRef', '$$itineraryRef'],
										},
										{
											$eq: ['$blockedUser', '$$blockedUser'],
										},
									],
								},
							},
						},
					],
					as: 'block',
				},
			},
			{
				$unwind: {
					path: '$block',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'messages',
					let: { channelRef: '$channelRef', block: '$block' },
					pipeline: [
						{
							$match: {
								$expr: {
									$cond:
									[{ $eq: [{ $not: '$$block' }, true] }, {
										$and: [
											{ $eq: ['$channelRef', '$$channelRef'] },
										],
									}, {
										$and: [
											{ $eq: ['$channelRef', '$$channelRef'] },
											{ $eq: ['$userRef', Types.ObjectId(id)] },
										],
									}],
								},
							},
						},
						{
							$sort: { createdOn: -1 },
						},
						{
							$limit: 1,
						},
					],
					as: 'message',
				},
			},
			{
				$unwind: {
					path: '$message',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'channeltousers',
					let: { channelRef: '$channelRef' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$channelRef', '$$channelRef'] },
										{ $ne: ['$userRef', Types.ObjectId(id)] },
									],
								},
							},
						},
						{
							$lookup: {
								from: otherUserQuery,
								let: {
									userRef: '$userRef', channelRef: '$channelRef',
								},
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													{ $eq: ['$_id', '$$userRef'] },
												],
											},
										},
									},
								],
								as: 'user',
							},
						},
						{
							$unwind: { path: '$user' },
						},
						{ $sort: { createdOn: -1 } },
						{ $limit: 1 },
						{
							$project: {
								_id: '$user._id',
								name: '$user.name',
								email: '$user.email',
								image: '$user.image',
								deleted: '$user.deleted',
							},
						},
					],
					as: 'otherUser',
				},
			},
			{
				$unwind: {
					path: '$otherUser',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'itineraries',
					let: { channelRef: '$channelRef' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$_id', '$$channelRef'] },
									],
								},
							},
						},
						{
							$lookup: {
								from: 'itineraryrequests',
								let: { formRef: '$formRef' },
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													{ $eq: ['$_id', '$$formRef'] },
												],
											},
										},
									},
									{ $limit: 1 },
								],
								as: 'itineraryrequest',
							},
						},
						{ $unwind: '$itineraryrequest' },
					],
					as: 'itinerary',
				},
			},
			{ $unwind: '$itinerary' },
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
					unseenMessages: { $cond: [{ $eq: [{ $not: '$block' }, true] }, { $cond: [{ $gt: [{ $size: '$unseenMessages' }, 0] }, true, false] }, false] },
				},
			},
			{
				$facet: {
					list: [
						...projectQuery,
						...paginationQuery,
					],
					totalUnseenChats: [
						{
							$match: {
								unseenMessages: true,
							},
						},
						{
							$count: 'count',
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
				$unwind: '$total',
			},
			{
				$unwind: {
					path: '$totalUnseenChats',
					preserveNullAndEmptyArrays: true,
				},
			},
		]);
		// console.timeLog('testing');
		return resolve({
			code: 100,
			message: 'success',
			data: (chats || {}).list || [],
			totalUnseenChats: chats ? ((chats.totalUnseenChats || {}).count || 0) : 0,
			page,
			limit,
			size: chats ? chats.list.length : 0,
			hasMore: chats ? ((chats.total.count || 0) > (((page - 1) * limit) + chats.list.length)) : 0,
		});
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
