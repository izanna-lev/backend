/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import { ResponseUtility } from 'appknit-backend-bundle';
import { StripeService } from '../../services';
import {
	CardModel,
} from '../../schemas';


export default ({
	id,
	cardRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!cardRef) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'There is some required property missing.' }));
		}

		const card = await CardModel.findOneAndUpdate({ userRef: id, _id: cardRef }, { deleted: true });

		if (!card) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid card' }));
		}

		const creditCard = await CardModel.findOne({
			_id: cardRef, userRef: id,
		});
		await StripeService.DeleteSource({
			customer: card.stripeCustomerId, source: creditCard.stripeId,
		});


		if (creditCard.defaultCard) {
			const newDefaultCard = await CardModel.findOneAndUpdate(
				{
					userRef: id,
					deleted: false,
				},
				{
					defaultCard: true,
				},
			);
			if (newDefaultCard) {
				await StripeService.UpdateDefaultSource({
					customer: newDefaultCard.stripeCustomerId,
					defaultSource: newDefaultCard.stripeId,
				});
			}
		}
		await CardModel.deleteOne({ _id: cardRef });
		return resolve(ResponseUtility.SUCCESS({
			message: 'Card removed Successfully.',
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
