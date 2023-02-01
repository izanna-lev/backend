/* eslint-disable no-underscore-dangle */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-undef */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import {
	NoteModel,
} from '../../schemas';

/**
* @description service model function to handle the adding of Note.
* @param {String} noteRef the unique _id of the note.
* @author Pavleen Kaur
* @since 29 August, 2022
*/

export default ({
	noteRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!noteRef) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property noteRef!' }));
		}
		await NoteModel.findOneAndUpdate(
			{ _id: noteRef },
			{ deleted: true },
			{ new: true },
		);
		return resolve(ResponseUtility.SUCCESS({
			message: 'Note Deleted Successfully!',
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
