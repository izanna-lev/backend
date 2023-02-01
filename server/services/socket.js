/* eslint-disable no-unused-vars */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
/* eslint-disable import/named */
/* eslint-disable no-use-before-define */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
import { Types } from 'mongoose';
import { EventEmitter } from 'events';
import {
	LATEST_LIMIT,
	TYPE_OF_NOTIFICATIONS, USER_TYPE,
} from '../constants';
import {
	ChannelToUserModel,
	MessageModel,
	NotificationModel,
	BlockModel,
	ItineraryModel,
	AdminModel,
} from '../schemas';
import { FirebaseNotificationService } from '.';
import { ChatModel, NotificationModel as NotificationsModel } from '../model';

const connector = new EventEmitter();

// connector.on('push', (payload) => {
// 	global.logger.info('Push Connector Initialized!');
// });

exports.connector = connector;

exports.startSocket = socket => new Promise(async (resolve, reject) => {
	try {
		const admin = await AdminModel.findOne({});
		const chats = await ChatModel.ChatList;
		global.logger.info(`Connected. ${socket.id}`);
		const notifications = await NotificationsModel.NotificationSpecialistListService;
		const { id } = socket.decoded.data;
		// connector.on('push', async (payload) => {
		// 	global.logger.info('Push Connector Listening!');
		// 	global.logger.info('payload', payload);
		// 	if ((payload && payload.webUser
		// 		&& payload.webUser.find(checkUser => checkUser.valueOf() === id))
		// 	|| (payload && payload.userRef === id)) {
		// 		global.logger.info('Event Created!');
		// 		const notes = await notifications({ id });
		// 		io.sockets.in(id).emit('notificationList', { data: { list: notes.data.list, totalUnread: notes.data.totalUnread } });
		// 	}
		// });
		socket.on('subscribe_channel', async (data, callback) => {
			if (!callback) {
				callback = function (message) {
					return message;
				};
			}

			if (data.channelRef) {
				const verifyUser = await ChannelToUserModel.findOne({
					userRef: data.id,
					channelRef: data.channelRef,
				});
				if (!verifyUser) {
					callback('You have to join this channel first.');
				}

				const checkBlock = await BlockModel.findOne(
					{ itineraryRef: data.channelRef, blockedUser: data.id },
				);
				if (!checkBlock) {
					socket.join(data.channelRef);
					callback(null, { channel: data.channelRef });
				}
			}
		});

		socket.on('unsubscribe_channel', async (data, callback) => {
			if (!callback) {
				callback = function (message) {
					return message;
				};
			}

			if (data.channelRef) {
				socket.leave(data.channelRef);
				callback(null, { channel: data.channelRef });
			}
		});

		socket.on('read', async (data, callback) => {
			if (!callback) {
				callback = function () {
				};
			}

			if (data.notificationRef && data.id) {
				await NotificationModel.updateOne({
					_id: data.notificationRef, seen: false,
				}, { seen: true });
				notifications({
					id: data.id,
				}).then((note) => {
					io.sockets.in(data.id).emit('notificationList', { data: { list: note.data.list, totalUnread: note.data.totalUnread } });
				});
			}
		});

		socket.on('read_all', async (data, callback) => {
			if (!callback) {
				callback = function () {
				};
			}

			if (data.channelRef && data.id) {
				await ChannelToUserModel.updateOne({
					userRef: data.id,
					channelRef: data.channelRef,
				}, { lastMessageReadAt: new Date() });
			}
		});

		socket.on('subscribe_user', async (data, callback) => {
			if (!callback) {
				callback = function () {
				};
			}
			/* Block Check By traveler */
			if (data.userRef) {
				const checkBlock = await BlockModel.findOne(
					{ itineraryRef: data.channelRef, blockedUser: data.userRef },
				);
				if (!checkBlock) {
					socket.join(data.userRef);
					callback(null, { channel: data.userRef });
				}
			}
		});

		socket.on('message', async (data, callback) => {
			console.log('listening!');
			if (!callback) {
				callback = function () {
				};
			}
			if (data.channelRef && data.message) {
				const messageObject = new MessageModel({
					userRef: data.id,
					channelRef: data.channelRef,
					message: data.message,
					messageType: data.messageType,
					createdOn: new Date(),
					updatedOn: new Date(),
				});
				messageObject.save();

				await ChannelToUserModel.updateOne({
					userRef: data.id,
					channelRef: data.channelRef,
				}, { lastMessageReadAt: new Date() });

				const socketData = {
					_id: messageObject._id,
					userId: data.id,
					userRef: data.id,
					name: data.name,
					createdOn: new Date(),
					message: data.message,
					messageType: data.messageType,
					channelRef: data.channelRef,
				};
				console.log('socketData', socketData);
				const [itinerary] = await ItineraryModel.aggregate([
					{ $match: { _id: Types.ObjectId(data.channelRef) } },
					{
						$lookup: {
							from: 'itineraryrequests',
							let: { formRef: '$formRef' },
							pipeline: [
								{
									$match: {
										$expr: {
											$and: [
												{
													$eq: ['$_id', '$$formRef'],
												},
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
						$lookup: {
							from: 'specialists',
							let: { specialistRef: '$specialistRef' },
							pipeline: [
								{
									$match: {
										$expr: {
											$and: [
												{ $eq: ['$_id', '$$specialistRef'] },
											],
										},
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
							from: 'travellers',
							let: { travellerRef: '$travellerRef' },
							pipeline: [
								{
									$match: {
										$expr: {
											$and: [
												{ $eq: ['$_id', '$$travellerRef'] },
											],
										},
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
						$project: {
							formRef: '$formRef',
							name: { $concat: ['$itineraryrequest.firstName', ' ', '$itineraryrequest.lastName'] },
							travellerRef: '$travellerRef',
							specialistRef: '$specialistRef',
							traveller: '$traveller',
							specialist: '$specialist',
						},
					},
				]);
				let userQuery = '';
				let otherUserQuery = '';
				let userType;
				if (itinerary.traveller._id.valueOf() === data.id) {
					console.log('Sender is traveller!');
					userQuery = 'travellers';
					otherUserQuery = 'specialists';
					userType = USER_TYPE.TRAVELLER;
					socketData.traveller = {
						name: itinerary.name,
						image: itinerary.traveller.image,
					};
				} else if (admin._id.valueOf() === data.id) {
					console.log('Sender is admin!');
					userQuery = 'specialists';
					otherUserQuery = 'travellers';
					userType = USER_TYPE.ADMIN;
					socketData.admin = { name: 'Admin' };
				} else {
					console.log('Sender is specialist!');
					userQuery = 'specialists';
					otherUserQuery = 'travellers';
					userType = USER_TYPE.SPECIALIST;
					socketData.specialist = {
						name: itinerary.specialist.name,
						image: itinerary.specialist.image,
					};
				}
				socketData.userType = userType;
				const [user] = await ChannelToUserModel.aggregate([
					{
						$match: {
							channelRef: Types.ObjectId(data.channelRef),
							userRef: Types.ObjectId(data.id),
						},
					},
					{
						$lookup: {
							from: userQuery,
							let: {
								userRef: '$userRef',
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
					{
						$project: {
							_id: '$user._id',
							name: { $cond: [{ $eq: [userQuery, 'specialists'] }, '$user.name', itinerary.name] },
							image: '$user.image',
						},
					},
				]);
				console.log('user', user);
				const [otherUser] = await ChannelToUserModel.aggregate([
					{
						$match: {
							channelRef: Types.ObjectId(data.channelRef),
							userRef: { $nin: [Types.ObjectId(data.id), Types.ObjectId(admin._id.valueOf())] },
						},
					},
					{
						$lookup: {
							from: otherUserQuery,
							let: {
								userRef: '$userRef',
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
					{
						$project: {
							_id: '$user._id',
							name: { $cond: [{ $ne: [userQuery, 'travellers'] }, '$user.name', itinerary.name] },
							image: '$user.image',
							fcmToken: '$user.fcmToken',
							device: '$user.device',
						},
					},
				]);
				console.log('otherUser', otherUser);
				io.sockets.in(data.channelRef).emit('message', socketData);
				io.to(otherUser._id).emit('message', socketData);
				let checkBlock;
				if (otherUser) {
					checkBlock = await BlockModel.findOne(
						{ itineraryRef: itinerary._id, blockedUser: otherUser._id },
					);
				}
				if (itinerary.specialistRef) {
					chats({
						id: itinerary.specialistRef, type: 'specialist',
					}).then((chat) => {
						io.sockets.in(itinerary.specialistRef.valueOf()).emit('chatList', { data: chat.data, totalUnseenChats: chat.totalUnseenChats });
					});
					notifications({
						id: itinerary.specialistRef,
					}).then((note) => {
						io.sockets.in(itinerary.specialistRef.valueOf()).emit('notificationList', { data: { list: note.data.list, totalUnread: note.data.totalUnread } });
					});
				}
				chats({
					id: admin._id, type: 'admin',
				}).then((chat) => {
					io.sockets.in(admin._id.valueOf()).emit('chatList', { data: chat.data, totalUnseenChats: chat.totalUnseenChats });
				});
				const sender = data.id === admin._id.valueOf() ? 'Admin' : user.name;
				if (!checkBlock) {
					if (otherUser) {
						const notification = await NotificationModel({
							userRef: otherUser._id,
							type: TYPE_OF_NOTIFICATIONS.MESSAGE,
							image: data.id === admin._id.valueOf() ? '' : user.image,
							sourceRef: data.channelRef,
							notificationFrom: data.id,
							text: `${sender} sent you a message.`,
							userDetails: itinerary.specialistRef ? {
								id: itinerary.specialistRef,
								name: itinerary.specialist.name,
							} : { id: admin._id.valueOf(), name: 'Admin' },
						});
						notification.save();
						if (otherUser.fcmToken) {
							await FirebaseNotificationService({
								deviceTokens: [otherUser.fcmToken],
								device: otherUser.device,
								type: TYPE_OF_NOTIFICATIONS.MESSAGE,
								body: data.message,
								payload: {
									body: data.message,
									notificationFrom: data.id,
									userRef: otherUser._id ? otherUser._id.valueOf() : otherUser._id,
									channelRef: data.channelRef,
									user: {
										_id: data.id,
										name: sender,
									},
								},
								userDetails: itinerary.specialistRef ? {
									id: itinerary.specialistRef,
									name: itinerary.specialist.name,
								} : { id: admin._id.valueOf(), name: 'Admin' },
								reference: notification._id,
								title: data.id === admin._id.valueOf() ? 'Onsite' : user.name,
							});
						}
					}
				}

				callback(null, { });
			}
		});

		socket.on('click', async (data, callback) => {
			await ChannelToUserModel.updateOne({
				userRef: data.id,
				channelRef: data.channelRef,
			}, { lastMessageReadAt: new Date() });
			const itinerary = await ItineraryModel.findOne({ _id: data.channelRef });
			if (itinerary.specialistRef) {
				chats({
					id: itinerary.specialistRef, type: 'specialist',
				}).then((chat) => {
					io.sockets.in(itinerary.specialistRef.valueOf()).emit('chatList', { data: chat.data, totalUnseenChats: chat.totalUnseenChats });
				});
			}
			chats({
				id: admin._id, type: 'admin',
			}).then((chat) => {
				io.sockets.in(admin._id.valueOf()).emit('chatList', { data: chat.data, totalUnseenChats: chat.totalUnseenChats });
			});
		});
		// socket.on('disconnect', async () => {
		// 	global.logger.info('DISCONNECTED');
		// });
		// global.io = io;
	} catch (err) {
		// global.logger.info(`Some error occured while initializing socket.: ${err}`);
		return ('Some error occured while initializing socket.');
	}
});
