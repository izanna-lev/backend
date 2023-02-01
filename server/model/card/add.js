/* eslint-disable no-unused-vars */
/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import { Types } from 'mongoose';
import { ResponseUtility } from 'appknit-backend-bundle';
import { StripeService } from '../../services';

import {
	TravellerModel,
	CardModel,
} from '../../schemas';

export default ({
	id,
	stripeToken,
}) => new Promise(async (resolve, reject) => {
	try {
		const user = await TravellerModel.findOne(
			{ _id: id, deleted: false, blocked: false },
		);
		if (!user) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'User does not exists.' }));
		}
		let { stripeCustomerId } = user;
		if (!stripeCustomerId) {
			const stripeUser = await StripeService.CreateUser({ email: user.email, name: user.name });
			const updateQuery = {
				stripeCustomerId: stripeUser.altered.id,
			};
			await TravellerModel.updateOne({ _id: id }, updateQuery);
			stripeCustomerId = stripeUser.altered.id;
		}


		const source = await StripeService.CreateSource({
			customer: stripeCustomerId, source: stripeToken,
		});
		const CreditCardObject = new CardModel({
			userRef: id,
			stripeToken,
			stripeId: source.id,
			stripeCustomerId: source.customer,
			lastDigitsOfCard: source.last4,
			cardType: source.brand,
			country: source.country,
		});
		await CreditCardObject.save();

		return resolve(ResponseUtility.SUCCESS({
			data: {
				...CreditCardObject._doc,
				stripeToken: undefined,
				stripeId: undefined,
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
