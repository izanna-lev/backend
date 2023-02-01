/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { TemplateModel } from '../../schemas';
/**
* @description service model function to handle the Notification Template Listing.
*/

export default () => new Promise(async (resolve, reject) => {
	try {
		const templates = await TemplateModel.find();
		const notificationTemplates = templates.map(template => template.title);
		return resolve(ResponseUtility.SUCCESS({
			data: { templates: notificationTemplates },
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
