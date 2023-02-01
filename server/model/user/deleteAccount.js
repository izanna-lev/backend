/* eslint-disable import/named */
/* eslint-disable camelcase */
/* eslint-disable import/named */
/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { TravellerModel } from '../../schemas';
import { RowndService } from '../../services';

/**
 * @description service model function to handles the delete Account
 * of a traveller from db as well as Rownd dashboard.
 * @param {String} id decoded from token.
 * @author Pavleen Kaur
 * @since 21 Sept, 2022
 */

export default ({ id }) => new Promise(async (resolve, reject) => {
	try {
		const user = await TravellerModel.findOne({ _id: id });
		await RowndService.rownd.deleteUser(user.rowndId);
		await TravellerModel.findOneAndUpdate(
			{ _id: id, deleted: false },
			{ deleted: true },
		);
		return resolve(ResponseUtility.SUCCESS({ message: 'Your Account has been deleted Successfully!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
