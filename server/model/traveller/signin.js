/* eslint-disable no-async-promise-executor */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-undef */
/* eslint-disable max-len */
/* eslint-disable camelcase */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
	TokenUtility,
} from 'appknit-backend-bundle';
import { RowndService } from '../../services';
import { TravellerModel } from '../../schemas';
import { APP_ID } from '../../constants';

/**
 * @description service model function to handles the ROWND signin
 * of a traveller.
 * @param {String} user_id decoded from Rownd auth token.
 * @author Pavleen Kaur
 * @since 17 August, 2022
 */

export default ({
	user_id,
	fcmToken = '',
	device = '',
}) => new Promise(async (resolve, reject) => {
	try {
		console.log('fcmToken', fcmToken);
		console.log('device', device);
		const userInfo = await RowndService.rownd.fetchUserInfo({
			user_id,
			app_id: APP_ID,
		});
		const emailExists = await TravellerModel.findOne({ email: userInfo.data.email, rowndId: userInfo.data.user_id, deleted: false });
		if (emailExists !== null ? emailExists.blocked : false) {
			return resolve({ code: 401, message: 'Your Account has been blocked by Admin' });
		}
		let traveller;
		if (emailExists) {
			traveller = await TravellerModel.findOneAndUpdate(
				{ _id: emailExists._id },
				{ fcmToken, device },
				{ new: true },
			);
		} else {
			traveller = new TravellerModel({
				rowndId: userInfo.data.user_id,
				email: userInfo.data.email,
				name: userInfo.data.email.split('@')[0],
				fcmToken,
				device,
			});
			await traveller.save();
		}

		const token = await TokenUtility.generateToken({
			id: traveller._id,
			email: traveller.email,
			tokenLife: '7d',
			role: 'user',
		});
		console.log('traveller', traveller);
		return resolve(ResponseUtility.SUCCESS({
			message: 'User Signed In Sucessfully!',
			data: {
				accessToken: token,
				traveller,
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
