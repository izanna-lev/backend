/* eslint-disable max-len */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
	HashUtility,
	TokenUtility,
} from 'appknit-backend-bundle';
import { SpecialistModel } from '../../schemas';
import { RedisService } from '../../services';

export default ({
	email,
	password,
	device = '',
	fcmToken = '',
}) => new Promise(async (resolve, reject) => {
	try {
		if (!email || !password) {
			return reject(ResponseUtility.MISSING_PROPS({ message: `Missing property ${email ? 'password' : 'email'}.` }));
		}
		const checkUnique = await SpecialistModel.findOne(
			{ email: email.toLowerCase() },
		).sort({ createdAt: -1 });
		if (!checkUnique) {
			return reject(ResponseUtility.NO_USER());
		}
		if (checkUnique.deleted || checkUnique.blocked) {
			return reject(ResponseUtility.GENERIC_ERR({
				message: `Your Account has been ${checkUnique.deleted ? 'deleted!' : 'deactivated!'}`,
			}));
		}
		const passwordMatch = await HashUtility.compare({
			text: password,
			hash: checkUnique.password,
		});
		if (!passwordMatch) {
			return reject(ResponseUtility.LOGIN_AUTH_FAILED());
		}

		const token = await TokenUtility.generateToken({
			id: checkUnique._id,
			email,
			tokenLife: '60d',
			role: 'specialist',
		});

		await RedisService.set(
			checkUnique._id.toString(), JSON.stringify({ blocked: false, deleted: false }),
		);
		// update the fcmToken and device
		await SpecialistModel.updateOne({ _id: checkUnique._id }, { fcmToken, device });
		const specialist = await SpecialistModel.findOne({ _id: checkUnique._id }, { password: 0 });
		return resolve(ResponseUtility.SUCCESS({
			data: {
				accessToken: token,
				user: specialist,
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
