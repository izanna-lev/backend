/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable import/named */
import {
	ResponseUtility, PropsValidationUtility,
} from 'appknit-backend-bundle';
import {
	SpecialistModel,
} from '../../schemas';
import { WEB_HOST, NODE_ENV } from '../../constants';
import { TemplateMailService } from '../../services';
import { ImageUploadUtility } from '../../utility';
/**
* @description service model function to handle the creation of a Specialist.
* @param {String} name the name of the specialist.
* @param {String} specialistEmail the email of the specialist.
* @param {Binary} image the image of the specialist.
* @param {String} phoneNumber the phoneNumber of the specialist.
* @param {Boolean} isCreate the permission for create itinerary for specialist.
* @param {Boolean} isEdit the permission for edit itinerary for specialist.
* @param {Boolean} isDelete the permission for delete itinerary for specialist.
* @param {Boolean} isSendNotifications the permission for send notification for specialist.
* @author Pavleen Kaur
* @since 17 Sept, 2022
*/

export default ({
	name,
	specialistEmail,
	image,
	phoneNumber,
	access,
	phoneCode,
}) => new Promise(async (resolve, reject) => {
	try {
		const { code, message } = await PropsValidationUtility({
			validProps: ['name', 'specialistEmail', 'image', 'phoneCode', 'phoneNumber', 'access'],
			sourceDocument: {
				name,
				specialistEmail,
				image,
				phoneNumber,
				access,
				phoneCode,
			},
		});

		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}
		const emailAlreadyTaken = await SpecialistModel.findOne({ email: specialistEmail, deleted: false });
		if (emailAlreadyTaken) {
			return reject(ResponseUtility.EMAIL_ALREADY_TAKEN({ message: 'Email Already Taken!' }));
		}
		let imageName;
		if (image) {
			imageName = `${NODE_ENV}-specialistImage-${Date.now()}`;
			await ImageUploadUtility(imageName, image);
		}


		const specialist = new SpecialistModel({
			name,
			email: specialistEmail,
			password: Math.random().toString(36).slice(2, 10),
			image: imageName,
			phoneNumber,
			access,
			phoneCode,

		});
		TemplateMailService.VerificationMail({
			to: specialistEmail,
			name,
			email: specialistEmail,
			password: specialist.password,
			url: WEB_HOST,
		});
		await specialist.save();
		return resolve(ResponseUtility.SUCCESS({
			message: 'Specialist created successfully!',
			data: {
				...specialist._doc,
			    password: undefined,
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
