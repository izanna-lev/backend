/* eslint-disable import/named */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ItineraryModel } from '../../schemas';
import { PAGINATION_LIMIT } from '../../constants';
/**
* @description service model function to fetch the listing of transactions
* @author Pavleen Kaur
* @since 26 September, 2022
*/

export default ({
	id,
	fromDate,
	toDate,
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		const dateQuery = [];
		if (fromDate) {
			const fromDateModified = new Date(`${((new Date(fromDate)).toISOString().split('T'))[0]}:00:00:00.000Z`);
			dateQuery.push({ $gte: ['$createdOn', fromDateModified] });
		}
		if (toDate) {
			const toDateModified = new Date(`${((new Date(toDate)).toISOString().split('T'))[0]}:00:00:00.000Z`);
			dateQuery.push({ $lte: ['$createdOn', toDateModified] });
		}

		const transactions = await ItineraryModel.aggregate([
			{ $match: { travellerRef: Types.ObjectId(id) } },
			{
				$lookup: {
					from: 'transactions',
					let: { itineraryRef: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$itineraryRef', '$$itineraryRef'] },
										...dateQuery,
									],
								},
							},
						},
					],
					as: 'transaction',
				},
			},
			{
				$match: {
					$expr: {
						$and: [
							{ $ne: ['$transaction', []] },
						],
					},
				},
			},
			{
				$unwind: '$transaction',
			},
			{
				$sort: {
					'transaction.createdOn': -1,
				},
			},
			{
				$project: {
					name: '$name',
					price: '$transaction.price',
					lastDigitsCard: '$transaction.stripeChargeResponse.payment_method_details.card.last4',
					transactionType: '$transaction.transactionType',
					createdOn: '$transaction.createdOn',
				},
			},
		]);
		return resolve(ResponseUtility.SUCCESS({
			data: transactions,
			page,
			limit,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
