/* eslint-disable no-unused-vars */
/* eslint-disable import/named */
/* eslint-disable consistent-return */
/* eslint-disable import/no-extraneous-dependencies */

import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import request from 'request';
import { APP_NAME } from '../constants';
import { connector } from './socket';

/* eslint-disable no-underscore-dangle */
/* eslint-disable global-require */
/**
* This is the indexer for Firebase Notification Service.
* @author Abhinav Sharma
* @since 19 December 2020
*/
const { FCM_SERVER_KEY } = process.env;

export default ({
	type,
	device,
	title = APP_NAME,
	body = '',
	dataObject = {},
	payload = {},
	userDetails = {},
	reference = '',
	deviceTokens = [],
}) => new Promise((resolve, reject) => {
	try {
		if (!(deviceTokens.length && device && type)) {
			// eslint-disable-next-line no-nested-ternary
			return reject(ResponseUtility.MISSING_PROPS({ message: `Missing Property ${deviceTokens ? (device ? 'type' : 'device') : 'deviceTokens'}` }));
		}
		if (!FCM_SERVER_KEY) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing required FCM_SERVER_KEY environment variable.' }));
		}
		const headers = {
			'Content-Type': 'application/json',
			Authorization: `key=${FCM_SERVER_KEY}`,
		};
		const data = {
			reference: payload.reference,
			type,
			title,
			body: payload.body,
			payload,
			sound: 'default',
		};
		const payloadData = {
			registration_ids: deviceTokens,
			priority: 'high',
			timeToLive: 86400,
			body,
			data: {
				type,
				...payload,
				userDetails: userDetails || {},
			},
		};
		Object.assign(payloadData, { notification: data });

		const options = {
			url: 'https://fcm.googleapis.com/fcm/send',
			method: 'POST',
			body: payloadData,
			rejectUnauthorized: false,
			json: true,
			headers,
		};
		request(options, (error, response, data_) => {
			if (error) {
				return reject(error);
			}
			const pushConnect = connector;
			pushConnect.emit('push', payload);
			resolve(data_);
		});
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
