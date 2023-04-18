/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { USER_TYPE, MONTH_ARRAY, HYPHEN } from '../../constants';
import {
	ChannelToUserModel, ItineraryModel, MessageModel, BlockModel,
} from '../../schemas';

export default ({
	id,
	channelId,
	type,
	page = 1,
	limit = 30,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!channelId) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property channelId' }));
		}
		let fromQuery;
		let letQuery;
		let projectQuery;
		const blockQuery = [];
		if (type === 'user') {
			fromQuery = 'specialists';
			letQuery = { userRef: '$specialistRef', formRef: '$formRef' };
			projectQuery = [{
				$project: {
					_id: '$_id',
					formRef: '$formRef',
					location: { $ifNull: ['$location.location', '$user.location'] },
					itineraryStatus: '$itineraryStatus',
					image: '$image',
					fromDate: { $ifNull: ['$fromDate', '$user.plannedDate'] },
					toDate: '$toDate',
					otherUserName: { $ifNull: ['$user.name', 'Admin'] },
					blockedByTraveller: { $cond: [{ $eq: ['$block', []] }, false, true] },
				},
			}];
		} else if (type === 'specialist') {
			fromQuery = 'travellers';
			letQuery = { userRef: '$travellerRef', formRef: '$formRef' };
			const block = {
				$lookup: {
					from: 'blocks',
					let: {
						blockedUser: '$specialistRef', blockedBy: '$travellerRef', channelRef: '$_id',
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$or: [
										{
											$and: [
												{ $eq: ['$blockedBy', '$$blockedBy'] },
												{ $eq: ['$blockedUser', '$$blockedUser'] },
												{ $eq: ['$itineraryRef', '$$channelRef'] },
											],
										},
									],
								},
							},
						},
					],
					as: 'block',
				},
			};
			projectQuery = [{
				$project: {
					_id: '$_id',
					formRef: '$formRef',
					location: { $ifNull: ['$location.location', '$user.location'] },
					itineraryStatus: '$itineraryStatus',
					image: '$image',
					fromDate: {
						$ifNull: [{
							$concat: [{
								$toString: { $dayOfMonth: '$fromDate' },
							}, HYPHEN, {
								$arrayElemAt: [
									MONTH_ARRAY,
									{ $month: '$fromDate' },
								],
							}, HYPHEN, {
								$toString: { $year: '$fromDate' },
							}],
						}, {
							$concat: [{
								$toString: { $dayOfMonth: '$user.plannedDate' },
							}, HYPHEN, {
								$arrayElemAt: [
									MONTH_ARRAY,
									{ $month: '$user.plannedDate' },
								],
							}, HYPHEN, {
								$toString: { $year: '$user.plannedDate' },
							}],
						}],
					},
					otherUserName: '$user.name',
					userImage: '$user.image',
					blockedByTraveller: { $cond: [{ $eq: ['$block', []] }, false, true] },
				},
			}];
			blockQuery.push(block);
		} else {
			fromQuery = 'travellers';
			letQuery = { userRef: '$travellerRef', formRef: '$formRef' };
			projectQuery = [{
				$project: {
					_id: '$_id',
					formRef: '$formRef',
					location: { $ifNull: ['$location.location', '$user.location'] },
					itineraryStatus: '$itineraryStatus',
					image: '$image',
					fromDate: {
						$ifNull: [{
							$concat: [{
								$toString: { $dayOfMonth: '$fromDate' },
							}, HYPHEN, {
								$arrayElemAt: [
									MONTH_ARRAY,
									{ $month: '$fromDate' },
								],
							}, HYPHEN, {
								$toString: { $year: '$fromDate' },
							}],
						}, {
							$concat: [{
								$toString: { $dayOfMonth: '$user.plannedDate' },
							}, HYPHEN, {
								$arrayElemAt: [
									MONTH_ARRAY,
									{ $month: '$user.plannedDate' },
								],
							}, HYPHEN, {
								$toString: { $year: '$user.plannedDate' },
							}],
						}],
					},
					otherUserName: '$user.name',
					userImage: '$user.image',
				},
			}];
		}
		const [channel] = await ItineraryModel.aggregate([
			{ $match: { _id: Types.ObjectId(channelId) } },
			{
				$lookup: {
					from: fromQuery,
					let: letQuery,
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
						{
							$lookup: {
								from: 'itineraryrequests',
								let: { },
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
						{ $unwind: { path: '$itineraryrequest', preserveNullAndEmptyArrays: true } },
						{
							$project: {
								name: { $ifNull: [{ $concat: ['$itineraryrequest.firstName', ' ', '$itineraryrequest.lastName'] }, '$name'] },
								image: '$image',
								location: '$itineraryrequest.location',
								plannedDate: '$itineraryrequest.plannedDate',
							},
						},
					],
					as: 'user',
				},
			},
			{
				$unwind: { path: '$user', preserveNullAndEmptyArrays: true },
			},
			...blockQuery,
			...projectQuery,
		]);
		if (!channel) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No channel found for this user' }));
		}
		await ChannelToUserModel.updateOne({
			userRef: id,
			channelRef: channel._id,
		}, { lastMessageReadAt: new Date() });
		/* Specialist won't receive the messages if blocked by traveller */
		const filterMessages = [];
		const checkBlock = await BlockModel.findOne({ itineraryRef: channelId, blockedUser: id });
		if (checkBlock) {
			const filter = {
				$match: {
					$expr: {
						$and: [
							{ $lt: ['$createdOn', new Date(checkBlock.createdAt)] },
						],
					},
				},
			};
			filterMessages.push(filter);
		}
		const messages = await MessageModel.aggregate([
			{
				$match: {
					channelRef: channel._id,
				},
			},
			{
				$lookup: {
					from: 'specialists',
					let: { userRef: '$userRef' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{
											$eq: ['$_id', '$$userRef'],
										},
									],
								},
							},
						},
						{
							$addFields: {
								userType: USER_TYPE.SPECIALIST,
							},
						},
					],
					as: 'specialist',
				},
			},
			{
				$unwind: { path: '$specialist', preserveNullAndEmptyArrays: true },
			},
			{
				$lookup: {
					from: 'itineraryrequests',
					let: { travellerRef: '$userRef', formRef: Types.ObjectId(channel.formRef) },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{
											$eq: ['$_id', '$$formRef'],
										},
										{
											$eq: ['$travellerRef', '$$travellerRef'],
										},
									],
								},
							},

						},
						{ $limit: 1 },
						{
							$addFields: {
								userType: USER_TYPE.TRAVELLER,
							},
						},
					],
					as: 'traveller',
				},
			},
			{
				$unwind: { path: '$traveller', preserveNullAndEmptyArrays: true },
			},
			{
				$lookup: {
					from: 'admins',
					let: { userRef: '$userRef' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{
											$eq: ['$_id', '$$userRef'],
										},
									],
								},
							},
						},
						{
							$addFields: {
								userType: USER_TYPE.ADMIN,
							},
						},
					],
					as: 'admin',
				},
			},
			{
				$unwind: { path: '$admin', preserveNullAndEmptyArrays: true },
			},
			...filterMessages,
			{
				$project: {
					userRef: '$userRef',
					channelRef: '$channelRef',
					message: '$message',
					createdOn: '$createdOn',
					messageType: '$messageType',
					traveller: { $cond: [{ $eq: ['$traveller.userType', USER_TYPE.TRAVELLER] }, { name: { $concat: ['$traveller.firstName', ' ', '$traveller.lastName'] } }, '$$REMOVE'] },
					admin: { $cond: [{ $eq: ['$admin.userType', USER_TYPE.ADMIN] }, { name: 'Admin' }, '$$REMOVE'] },
					specialist: { $cond: [{ $eq: ['$specialist.userType', USER_TYPE.SPECIALIST] }, { name: '$specialist.name', image: '$specialist.image' }, '$$REMOVE'] },
					userType: {
						$switch: {
							branches: [
								{ case: { $eq: [{ $not: '$traveller' }, false] }, then: USER_TYPE.TRAVELLER },
								{ case: { $eq: [{ $not: '$admin' }, false] }, then: USER_TYPE.ADMIN },
								{ case: { $eq: [{ $not: '$specialist' }, false] }, then: USER_TYPE.SPECIALIST },
							],
							default: USER_TYPE.TRAVELLER,
						},
					},
				},
			},
			{
				$sort: { createdOn: -1 },
			},
			{
				$skip: limit * (page - 1),
			},
			{
				$limit: limit,
			},
		]);
		return resolve(ResponseUtility.SUCCESS({
			data: { messages, itinerary: channel }, page, limit,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
