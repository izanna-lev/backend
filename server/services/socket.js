/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
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
	TYPE_OF_NOTIFICATIONS, USER_TYPE, DISCONNECT_TIMEOUT,
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

exports.connector = connector;

exports.startSocket = socket => new Promise(async (resolve, reject) => {
	try {
		global.logger.info(`Connected. ${socket.id}`);
		const admin = await AdminModel.findOne({});
		const chats = await ChatModel.ChatList;
		const notifications = await NotificationsModel.NotificationSpecialistListService;
		if (connector.listenerCount('push') === 0) {
			connector.on('push', async (payload) => {
				global.logger.info('Push Connector Listening!');
				global.logger.info('payload', payload);
				if (payload && payload.userRef && !payload.webUser) {
					global.logger.info('Push Event Created!');
					const data = await NotificationModel.find(
						{ userRef: payload.userRef },
					).sort({ createdOn: -1 }).limit(LATEST_LIMIT);
					const available = io.sockets.adapter.rooms[payload.userRef.valueOf()];
					socket.join(payload.userRef.valueOf());
					const total = data.some(notification => notification.seen === false);
					io.sockets.in(payload.userRef).emit('notificationList', { data: { list: data, totalUnread: total } });
					if (!available) {
						socket.leave(payload.userRef);
					}
				} else if (payload && payload.webUser.length) {
					global.logger.info('Event Created!');
					for (let i = 0; i < payload.webUser.length; i += 1) {
						const available = io.sockets.adapter.rooms[payload.webUser[i].valueOf()];
						socket.join(payload.webUser[i].valueOf());
						const data = await NotificationModel.find(
							{ userRef: payload.webUser[i] },
						).sort({ createdOn: -1 }).limit(LATEST_LIMIT);
						const total = data.some(notification => notification.seen === false);
						io.sockets.in(payload.webUser[i].valueOf()).emit('notificationList', { data: { list: data, totalUnread: total } });
						if (!available) {
							socket.leave(payload.webUser[i].valueOf());
						}
					}
				}
			});
		}

		socket.on('subscribe_channel', async (data, callback) => {
			global.logger.info('Subscribe channel!');
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
			global.logger.info('Unsubscribe channel!');
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
			global.logger.info('Subscribe User!');
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

		// socket.on('reconnect', (attemptNumber) => {
		// 	global.logger.info(`Client ${socket.id} reconnected after attempt number ${attemptNumber}`);
		// });

		// socket.on('reconnect_error', (error) => {
		// 	global.logger.info(`Client ${socket.id} reconnection error:`, error);
		// });

		// socket.on('reconnect_failed', () => {
		// 	global.logger.info(`Client ${socket.id} reconnection failed`);
		// });

		socket.on('message', async (data, callback) => {
			global.logger.info('Message!');
			if (!callback) {
				callback = function () {
				};
			}
			// const messageId = `${data.message}-${Math.random().toString(36).substring(2)}`;
			// if (socket.processedMessages.has(messageId)) {
			// 	console.log('Ignoring duplicate message:', data.message);
			// 	return;
			// }
			// console.log('Processing message:', data.message);
			// socket.processedMessages.add(messageId);
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
				console.log('itinerary', itinerary);
				let userQuery = '';
				let otherUserQuery = '';
				let adminOnly = false;
				const otherUserMatchQuery = [Types.ObjectId(data.id)];
				let userType;
				if (itinerary.traveller._id.valueOf() === data.id) {
					userQuery = 'travellers';
					otherUserQuery = 'specialists';
					if (itinerary.specialist) {
						otherUserMatchQuery.push(admin._id);
					}
					if (!itinerary.specialistRef) {
						adminOnly = true;
					}
					userType = USER_TYPE.TRAVELLER;
					socketData.traveller = {
						name: itinerary.name,
						image: itinerary.traveller.image,
					};
				} else if (admin._id.valueOf() === data.id) {
					userQuery = 'specialists';
					otherUserQuery = 'travellers';
					if (itinerary.specialist) {
						otherUserMatchQuery.push(itinerary.specialistRef);
					}
					userType = USER_TYPE.ADMIN;
					socketData.admin = { name: 'Admin' };
				} else {
					userQuery = 'specialists';
					otherUserQuery = 'travellers';
					userType = USER_TYPE.SPECIALIST;
					otherUserMatchQuery.push(admin._id);
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
						$unwind: { path: '$user', preserveNullAndEmptyArrays: true },
					},
					{
						$project: {
							_id: { $cond: [{ $eq: [userQuery, 'specialists'] }, { $cond: [{ $or: [{ $eq: [{ $not: itinerary.specialist }, true] }, { $eq: [data.id, admin._id.valueOf()] }] }, admin._id, '$user._id'] }, '$user._id'] },
							name: { $cond: [{ $eq: [userQuery, 'specialists'] }, { $cond: [{ $or: [{ $eq: [{ $not: itinerary.specialist }, true] }, { $eq: [data.id, admin._id.valueOf()] }] }, 'Admin', '$user.name'] }, itinerary.name] },
							image: { $cond: [{ $eq: [userQuery, 'specialists'] }, { $cond: [{ $or: [{ $eq: [{ $not: itinerary.specialist }, true] }, { $eq: [data.id, admin._id.valueOf()] }] }, '', '$user.image'] }, '$user.image'] },
						},
					},
				]);
				const [otherUser] = await ChannelToUserModel.aggregate([
					{
						$match: {
							channelRef: Types.ObjectId(data.channelRef),
							userRef: { $nin: otherUserMatchQuery },
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
						$unwind: { path: '$user', preserveNullAndEmptyArrays: true },
					},
					{
						$project: {
							_id: { $cond: [{ $eq: [otherUserQuery, 'travellers'] }, '$user._id', { $cond: [{ $eq: [{ $not: itinerary.specialist }, true] }, admin._id, '$user._id'] }] },
							name: { $cond: [{ $eq: [otherUserQuery, 'travellers'] }, itinerary.name, { $cond: [{ $eq: [{ $not: itinerary.specialist }, true] }, 'Admin', '$user.name'] }] },
							fcmToken: '$user.fcmToken',
							device: '$user.device',
						},
					},
				]);
				console.log('user', user);
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
				}
				chats({
					id: admin._id, type: 'admin',
				}).then((chat) => {
					io.sockets.in(admin._id.valueOf()).emit('chatList', { data: chat.data, totalUnseenChats: chat.totalUnseenChats });
				});

				if (!checkBlock) {
					if (otherUser && adminOnly === false) {
						const notification = new NotificationModel({
							userRef: otherUser._id,
							type: TYPE_OF_NOTIFICATIONS.MESSAGE,
							image: user.image,
							sourceRef: data.channelRef,
							notificationFrom: data.id,
							text: `${user.name} sent you a message.`,
							userDetails: itinerary.specialistRef ? {
								id: itinerary.specialistRef,
								name: itinerary.specialist.name,
							} : { id: admin._id.valueOf(), name: 'Admin' },
						});
						await notification.save();

						const notificationCount = await NotificationModel.find(
							{ userRef: itinerary.travellerRef, seen: false },
						).count();

						if (otherUser.fcmToken) {
							await FirebaseNotificationService({
								deviceTokens: [otherUser.fcmToken],
								device: otherUser.device,
								type: TYPE_OF_NOTIFICATIONS.MESSAGE,
								body: data.message,
								badge: notificationCount,
								payload: {
									body: data.message,
									notificationFrom: data.id,
									userRef: otherUser._id ? otherUser._id.valueOf() : otherUser._id,
									channelRef: data.channelRef,
									user: {
										_id: data.id,
										name: user.name,
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

		socket.on('disconnect', async (reason) => {
			global.logger.info('DISCONNECTED');
		});
		// global.io = io;
	} catch (err) {
		console.log('err', err);
		// global.logger.info(`Some error occured while initializing socket.: ${err}`);
		return ('Some error occured while initializing socket.');
	}
});
