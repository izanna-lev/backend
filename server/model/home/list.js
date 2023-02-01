/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-promise-executor-return */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import {
	ItineraryModel,
} from '../../schemas';
import {
	HOME_LIST_TYPE,
	ITINERARY_STATUS,
	PAGINATION_LIMIT,
} from '../../constants';

/**
* @description service model function to handle the listing of all Itineraries.
* @param {Number} itineraryStatus the status of the itinerary.
* @author Pavleen Kaur
* @since 1 August,2022
*/

export default ({
	id,
	listType = 1,
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		let message;
		let listQuery;

		if (listType === HOME_LIST_TYPE.CURRENT) { // ongoing
			message = 'Current';

			listQuery = [
				{ $eq: ['$itineraryStatus', ITINERARY_STATUS.ONGOING] },
			];
		} else if (listType === HOME_LIST_TYPE.PAST) {
			message = 'Past';

			listQuery = [
				{
					$or: [
						{ $eq: ['$itineraryStatus', ITINERARY_STATUS.COMPLETED] },
						{ $eq: ['$itineraryStatus', ITINERARY_STATUS.CANCELLED] },
					],

				},
			];
		} else if (listType === HOME_LIST_TYPE.PENDING) {
			message = 'Pending';

			listQuery = [
				{ $eq: ['$itineraryStatus', ITINERARY_STATUS.UPCOMING] },
			];
		}

		const data = await ItineraryModel.aggregate([
			{
				$match: {
					$expr: {
						$and: [
							{ $eq: ['$travellerRef', Types.ObjectId(id)] },
							{ $ne: ['$itineraryStatus', [ITINERARY_STATUS.EXPIRED, ITINERARY_STATUS.PENDING]] },
						],
					},
				},
			},
			{
				$sort: {
					updatedAt: -1,
				},
			},
			{
				$addFields: {
					previousStatus: '$itineraryStatus',
					itineraryStatus: {
						$switch: {
							branches: [
								{
									/*  Case: When itinerary is UPCOMING & it lies between its fromDate
                                    and toDate then it will be ONGOING provided it should not have
                                        the cancellation request on it  */
									case: {
										$and: [
											{ $eq: [{ $not: '$approved' }, false] },
											{ $eq: ['$itineraryStatus', ITINERARY_STATUS.UPCOMING] },
											{ $lt: [new Date(), '$toDate'] },
											{ $gt: [new Date(), '$fromDate'] },
											{ $not: '$cancellationRequest' },
										],
									},
									then: ITINERARY_STATUS.ONGOING,
								},
								{
									/*  Case: When itinerary is ONGOING & has reached its toDate
                                        & does not have request cancellation on it.
                                        with an itineraryStatus COMPLETED */
									case: {
										$and: [
											{ $eq: ['$itineraryStatus', ITINERARY_STATUS.ONGOING] },
											{ $not: '$cancellationRequest' },
											{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$toDate'] },
										],
									},
									then: ITINERARY_STATUS.COMPLETED,
								},
								{
									/*  Case: When itinerary is UPCOMING & has reached its fromDate
                                        & not approved by the traveller yet and it will be expired
                                        with an itineraryStatus CANCELLED */
									case: {
										$and: [
											{ $eq: ['$itineraryStatus', ITINERARY_STATUS.UPCOMING] },
											{ $not: '$approved' },
											{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$fromDate'] },
										],
									},
									then: ITINERARY_STATUS.CANCELLED,
								},
							],
							default: '$itineraryStatus',
						},
					},
				},
			},
			{
				$match: {
					$expr: {
						$and: [...listQuery],
					},
				},
			},
			{
				$project: {
					name: '$name',
					price: '$price',
					duration: '$duration',
					image: { $ifNull: ['$image', ''] },
					description: '$specialistNote',
					previousStatus: '$previousStatus',
					itineraryStatus: '$itineraryStatus',
					approved: { $cond: [{ $not: '$approved' }, false, true] },
				},
			},
		]);
		for (let i = 0; i < data.filter(obj => obj).length; i += 1) {
			if (data[i].previousStatus !== data[i].itineraryStatus) {
				await ItineraryModel.updateOne(
					{ _id: data[i]._id },
					{ itineraryStatus: data[i].itineraryStatus },
				);
			}
		}
		// data.forEach(async (update) => {
		// 	await ItineraryModel.updateOne(
		// 		{ _id: update._id },
		// 		{ itineraryStatus: update.itineraryStatus },
		// 	);
		// });
		return resolve(ResponseUtility.SUCCESS_PAGINATION({
			message: `${message} Itinerary fetched Successfully!`,
			data,
			page,
			limit,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
