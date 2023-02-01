/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import {
	CANCELLATION_CHARGE,
	ITINERARY_STATUS,
	PAYMENT_STATUS,
	TRANSACTION_TYPE,
	TYPE_OF_NOTIFICATIONS,
} from '../../constants';
import {
	ItineraryModel,
	TravellerModel,
	CardModel,
	TransactionModel,
	SpecialistModel,
} from '../../schemas';
import {
	FirebaseNotificationService,
	StripeService,
} from '../../services';
/**
* @description service model function to handle the cancellation of itinerary.
* @param {String} itineraryRef the unique _id of the itinerary.
*/

export default ({
	itineraryRef,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!itineraryRef) {
			reject(ResponseUtility.GENERIC_ERR({ message: 'Missing property itineraryRef!' }));
		}
		const [upcoming] = await ItineraryModel.aggregate([
			{ $match: { _id: Types.ObjectId(itineraryRef) } },
			{
				$project: {
					itineraryStatus: '$itineraryStatus',
					cancellationRequest: { $ifNull: ['$cancellationRequest', false] },
					approved: { $ifNull: ['$approved', false] },
					travellerRef: '$travellerRef',
					specialistRef: '$specialistRef',
				},
			},
		]);
		if (!upcoming) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid itineraryRef!' }));
		}
		if (upcoming.itineraryStatus !== ITINERARY_STATUS.UPCOMING) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Only upcoming itineraries can be cancelled!' }));
		}
		if (!upcoming.cancellationRequest) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No cancellation request by traveller yet.' }));
		}
		const traveller = await TravellerModel.findOne({ _id: upcoming.travellerRef });
		if (!traveller) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No traveller found' }));
		}

		const card = await CardModel.findOne(
			{
				userRef: traveller._id,
				deleted: false,
				defaultCard: true,
			},
		);
		if (!card) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'No card found' }));
		}
		if (
			(new Date(upcoming.cancellationRequest) - new Date(upcoming.approved)) > (24 * 60 * 60 * 1000)
		) {
			const description = 'Checkout : cancellation fee';
			const toPay = CANCELLATION_CHARGE;

			const payment = await StripeService.CreatePayment({
				amount: toPay * 100,
				source: card.stripeId,
				customer: card.stripeCustomerId,
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
				transactionType: TRANSACTION_TYPE.CANCELLATION_CHARGES,
				createdOn: new Date(),
				updateOn: new Date(),
			});
			await transactionObject.save();
		}

		const cancelled = await ItineraryModel.findOneAndUpdate(
			{ _id: itineraryRef },
			{ itineraryStatus: ITINERARY_STATUS.CANCELLED, paymentStatus: PAYMENT_STATUS.PAID },
			{ new: true },
		);
		const specialist = await SpecialistModel.findOne({ _id: upcoming.specialistRef });
		if (traveller.fcmToken && traveller.device) {
			await FirebaseNotificationService({
				deviceTokens: [traveller.fcmToken],
				device: traveller.device,
				type: TYPE_OF_NOTIFICATIONS.CANCEL_REQUEST,
				body: 'Your Itinerary has been cancelled',
				payload: {
					body: 'Your Itinerary has been cancelled',
					notificationFrom: specialist._id,
					userRef: cancelled.travellerRef,
					itineraryRef: cancelled._id,
				},
				reference: cancelled._id,
				title: 'Onsite',
			});
		}
		return resolve(ResponseUtility.SUCCESS({
			message: 'Itinerary Cancelled Successfully!',
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
