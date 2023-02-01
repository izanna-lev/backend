/* eslint-disable no-underscore-dangle */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-undef */
/* eslint-disable import/named */
import {
	ResponseUtility, PropsValidationUtility,
} from 'appknit-backend-bundle';
import { NODE_ENV } from '../../constants';
import {
	NoteModel,
} from '../../schemas';
import { ImageUploadUtility } from '../../utility';
import { DatesHandlerService } from '../../services';
/**
* @description service model function to handle the adding of Note.
* @param {String} itineraryRef the unique _id of the itinerary.
* @param {String} day the day of the itinerary.
* @param {String} image the image of the itinerary.
* @param {String} image the description of the itinerary.
* @author Pavleen Kaur
* @since 29 August, 2022
*/

export default ({
	itineraryRef,
	day,
	image,
	description,
}) => new Promise(async (resolve, reject) => {
	try {
		const { code, message } = await PropsValidationUtility({
			validProps: ['day', 'description', 'image'],
			sourceDocument: {
			    day,
				image,
				description,
			},
		});

		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}
		await DatesHandlerService.negativeHandler(day);
		let imageName;
		if (image) {
			imageName = `${NODE_ENV}-noteImage-${Date.now()}`;
			await ImageUploadUtility(imageName, image);
		}
		const note = new NoteModel({
			itineraryRef,
			day,
			image: imageName,
			description,
		});
		await note.save();
		return resolve(ResponseUtility.SUCCESS({
			message: 'Note Added Successfully!',
			data: note,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
