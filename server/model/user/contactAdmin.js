/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { TravellerModel } from '../../schemas';
import { CONTACT_US_EMAIL, APP_NAME } from '../../constants';
import { TemplateMailService } from '../../services';
/**
* @description service model function to handle contact admin.
* @author Abhinav Sharma
* @since 10 March, 2021
*/

export default ({
	id,
	message = '',
}) => new Promise(async (resolve, reject) => {
	try {
		if (!message) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing Property message!' }));
		}
		const user = await TravellerModel.findOne({ _id: id, deleted: false });
		if (!user) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No user Found !' }));
		}
		await TemplateMailService.ContactMail({
			to: CONTACT_US_EMAIL,
			name: 'Admin',
			emailSubject: `${APP_NAME} Query`,
			text: message.trim(),
			senderName: user.name || 'User',
			senderEmail: user.email,
		});
		return resolve(ResponseUtility.SUCCESS({ message: 'Your query has been submitted!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
