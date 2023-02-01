/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable import/named */
import {
	ResponseUtility, SchemaMapperUtility, HashUtility,
} from 'appknit-backend-bundle';
import { WEB_HOST, NODE_ENV } from '../../constants';
import {
	SpecialistModel,
} from '../../schemas';
import { TemplateMailService } from '../../services';
import { ImageUploadUtility } from '../../utility';
/**
* @description service model function to handle the editing of a Specialist.
* @param {String} specialistRef the _id of the specialist.
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
	specialistRef,
	name,
	specialistEmail,
	image,
	phoneNumber,
	access,
	phoneCode,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!specialistRef) {
			return resolve(ResponseUtility.MISSING_PROPS({ message: 'Missing property specialistRef!' }));
		}
		let imageName;
		if (image) {
			imageName = `${NODE_ENV}-specialistImage-${Date.now()}`;
			await ImageUploadUtility(imageName, image);
		}
		const emailAlreadyTaken = await SpecialistModel.findOne({ email: specialistEmail, deleted: false, _id: { $ne: specialistRef } });
		if (emailAlreadyTaken) {
			return reject(ResponseUtility.EMAIL_ALREADY_TAKEN({ message: 'Email Already Taken!' }));
		}
		const checkSpecialist = await SpecialistModel.findOne({ _id: specialistRef });
		const generatePassword = Math.random().toString(36).slice(2, 10);
		const hash = await HashUtility.generate({ text: generatePassword });
		const updateSpecialist = await SchemaMapperUtility({
			name,
			email: specialistEmail,
			image: imageName,
			password: specialistEmail !== checkSpecialist.email ? hash : checkSpecialist.password,
			phoneNumber,
			access,
			phoneCode,

		});
		if (specialistEmail !== checkSpecialist.email) {
			TemplateMailService.VerificationMail({
				to: specialistEmail,
				name,
				email: specialistEmail,
				password: generatePassword,
				url: WEB_HOST,
			});
		}
		const specialist = await SpecialistModel.findOneAndUpdate(
			{ _id: specialistRef },
			updateSpecialist,
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({
			message: 'Specialist Edited Successfully!',
			data: {
				...specialist._doc,
			    password: undefined,
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
