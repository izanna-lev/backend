/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import {
	CardModel,
} from '../../schemas';

export default ({
	id,
}) => new Promise(async (resolve, reject) => {
	try {
		const creditCards = await CardModel.find({ userRef: id, deleted: false },
			{
				stripeToken: 0,
				stripeId: 0,
			});

		if (!creditCards) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Can not find any cards.' }));
		}

		return resolve(ResponseUtility.SUCCESS({
			data: creditCards,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
