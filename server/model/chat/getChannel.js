/* eslint-disable max-len */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-new */
/* eslint-disable no-undef */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ITINERARY_STATUS } from '../../constants';
import {
	ChannelToUserModel, ItineraryModel,
} from '../../schemas';

export default ({
	id,
	type,
	itineraryRef,
}) => new Promise(async (resolve, reject) => {
	try {
		let otherUser;
		const itineraryExists = await ItineraryModel.findOne({ _id: itineraryRef });
		if (!itineraryExists) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Itinerary does not exist!' }));
		}
		if (itineraryExists.itineraryStatus !== ITINERARY_STATUS.ONGOING && itineraryExists.itineraryStatus !== ITINERARY_STATUS.UPCOMING) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Not an ongoing or upcoming Itinerary!' }));
		}
		if (type === 'user') {
			// Case 1: When only Admin is working on that itinerary
			if (itineraryExists.adminRef && !itineraryExists.specialistRef) {
				otherUser = itineraryExists.adminRef;
			} else if (itineraryExists.specialistRef && !itineraryExists.adminRef) {
				// Case 3: When only specialist is working on that itinerary
				otherUser = itineraryExists.specialistRef;
			} else if (!itineraryExists.adminRef && !itineraryExists.specialistRef) {
				// Case 4: When no ref on itinerary
				return reject(ResponseUtility.GENERIC_ERR({ message: 'Itinerary is not assigned yet!' }));
			} else if (itineraryExists.adminRef && itineraryExists.specialistRef) {
				// Case 2 : When Admin & specialist both are working on the itinerary.
				otherUser = itineraryExists.specialistRef;
			}
		} else {
			otherUser = itineraryExists.travellerRef;
		}
		const [channel] = await ChannelToUserModel.aggregate([
			{
				$match: { userRef: Types.ObjectId(id), channelRef: Types.ObjectId(itineraryRef) },
			},
			{
				$lookup: {
					from: 'channeltousers',
					let: {
						channelId: '$channelRef',
						userRef: Types.ObjectId(otherUser),
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$userRef', '$$userRef'] },
										{ $eq: ['$channelRef', '$$channelId'] },
									],
								},
							},
						},
					],
					as: 'channeltouser',
				},
			},
			{ $unwind: '$channeltouser' },
		]);
		let newChannel;
		// Case 2 : When Admin & specialist both are working on the itinerary.
		if (itineraryExists.adminRef && itineraryExists.specialistRef) {
			const findAdmin = await ChannelToUserModel.findOne({ channelRef: itineraryExists._id, userRef: itineraryExists.adminRef });
			if (!findAdmin) {
				const createChannelToAdmin = new ChannelToUserModel({
					userRef: itineraryExists.adminRef,
					channelRef: itineraryExists._id,
					lastMessageReadAt: Date.now(),
					createdOn: Date.now(),
					updatedOn: Date.now(),
				});
				await createChannelToAdmin.save();
			}
		}
		if (!channel) {
			let createChannelToOtherUser;
			let createChannelToUser;
			// To handle when only admin is working on itinerary avoiding duplicates for traveller.
			let findUser = await ChannelToUserModel.findOne({ userRef: id, channelRef: itineraryExists._id });
			if (!findUser) {
				createChannelToUser = new ChannelToUserModel({
					userRef: id,
					channelRef: itineraryExists._id,
					lastMessageReadAt: Date.now(),
					createdOn: Date.now(),
					updatedOn: Date.now(),
				});
				await createChannelToUser.save();
			}
			findUser = await ChannelToUserModel.findOne({ userRef: otherUser, channelRef: itineraryExists._id });
			if (!findUser) {
				createChannelToOtherUser = new ChannelToUserModel({
					userRef: otherUser,
					channelRef: itineraryExists._id,
					lastMessageReadAt: Date.now(),
					createdOn: Date.now(),
					updatedOn: Date.now(),
				});
				await createChannelToOtherUser.save();
			}
			newChannel = itineraryExists._id;
		} else {
			newChannel = channel.channelRef;
		}
		return resolve(ResponseUtility.SUCCESS({
			data: {
				channelId: newChannel,
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
