/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-undef */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';

import { ITINERARY_STATUS, PAYMENT_STATUS, TRANSACTION_TYPE } from '../../constants';
import {
	ItineraryModel,
	TravellerModel,
	TransactionModel,
	CardModel,
} from '../../schemas';
import { StripeService } from '../../services';
/**
* @description service model function to handle the completion of itinerary.
* @param {String} itineraryRef the unique _id of the itinerary.
* @author Haswanth Reddy
*/

export default ({
	id,
	itineraryRef,
	cardRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!itineraryRef || !cardRef) {
			return reject(ResponseUtility.GENERIC_ERR({ message: `Missing property ${itineraryRef ? 'cardRef' : 'itineraryRef'}` }));
		}
		const itinerary = await ItineraryModel.findOne(
			{
				_id: itineraryRef,
				travellerRef: id,
				itineraryStatus: ITINERARY_STATUS.UPCOMING,
				approved: { $exists: false },
			},
		);

		if (!itinerary) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Itinerary does not exist!' }));
		}
		const traveller = await TravellerModel.findOne(
			{ _id: id, deleted: false, blocked: false },
		);

		if (!traveller) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No user found' }));
		}

		// search card
		const card = await CardModel.findOne({ _id: cardRef, userRef: id });

		if (!card) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No card found' }));
		}

		// make payment
		const description = `Checkout : ${itinerary.location.location}`;
		const toPay = itinerary.price;

		const payment = await StripeService.CreatePayment({
			amount: toPay * 100,
			source: card.stripeId,
			customer: traveller._doc.stripeCustomerId,
			description,
		});

		const transactionObject = new TransactionModel({
			itineraryRef,
			stripeChargeId: payment.id,
			stripeChargeResponse: payment,
			transactionId: payment.balance_transaction,
			paymentMethod: payment.payment_method,
			receiptUrl: payment.receipt_url,
			description,
			price: toPay,
			transactionType: TRANSACTION_TYPE.PAID,
			createdOn: new Date(),
			updateOn: new Date(),
		});
		await transactionObject.save();

		const itineraryUpdate = await ItineraryModel.findOneAndUpdate(
			{
				_id: itineraryRef,
			},
			{
				approved: new Date(), paymentStatus: PAYMENT_STATUS.PAID,
			},
			{
				new: true,
			},
		);

		return resolve(ResponseUtility.SUCCESS({
			message: 'itinerary approved',
			data: itineraryUpdate,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
