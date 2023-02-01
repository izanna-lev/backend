/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import {
	TravellerModel,
} from '../../schemas';
import { ITINERARY_STATUS, PAGINATION_LIMIT } from '../../constants';

/**
* @description service model function to display the travellerDetails.
*/

export default ({
	userRef,
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		const data = await TravellerModel.aggregate([
			{
				$match: {
					$expr: {
						$and: [
							{ $eq: ['$_id', Types.ObjectId(userRef)] },
						],
					},
				},
			},
			{
				$lookup: {
					from: 'itineraryrequests',
					let: { id: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$travellerRef', '$$id'] },
									],
								},
							},
						},
						{
							$lookup: {
								from: 'itineraries',
								let: { id: '$_id' },
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													{ $eq: ['$formRef', '$$id'] },
												],
											},
										},
									},
								],
								as: 'itinerary',
							},
						},
						{
							$unwind: {
								path: '$itinerary',
								preserveNullAndEmptyArrays: true,
							},
						},
						{
							$addFields: {
								updatedStatus: {
									$switch: {
										branches: [
											{
												/*  Case: When itinerary is UPCOMING & it lies between its fromDate
													and toDate then it will be ONGOING provided it should not have
													the cancellation request on it  */
												case: {
													$and: [
														{ $eq: [{ $not: '$itinerary.approved' }, false] },
														{ $eq: ['$itinerary.itineraryStatus', ITINERARY_STATUS.UPCOMING] },
														{ $lt: [new Date(), '$itinerary.toDate'] },
														{ $gt: [new Date(), '$itinerary.fromDate'] },
														{ $not: '$itinerary.cancellationRequest' },
													],
												},
												then: ITINERARY_STATUS.ONGOING,
											},
											{
												/*  Case: When itinerary is UPCOMING & has reached its fromDate
													& not approved by the traveller yet and it will be expired
													with an itineraryStatus CANCELLED */
												case: {
													$and: [
														{ $eq: ['$itinerary.itineraryStatus', ITINERARY_STATUS.UPCOMING] },
														{ $not: '$itinerary.approved' },
														{ $gt: [new Date(), '$itinerary.fromDate'] },
													],
												},
												then: ITINERARY_STATUS.CANCELLED,
											},
											{
												/*  Case: When itinerary is PENDING & has reached its fromDate
													& not approved by the traveller yet and it will be expired
													with an itineraryStatus CANCELLED */
												case: {
													$and: [
														{ $eq: ['$itinerary.itineraryStatus', ITINERARY_STATUS.PENDING] },
														{ $not: '$itinerary.approved' },
														{ $gt: [new Date(), '$itinerary.fromDate'] },
													],
												},
												then: ITINERARY_STATUS.CANCELLED,
											},
											{
												/*  Case: If requested and itinerary not created
														& exceeds planned date */
												case: {
													$and: [
														{ $cond: [{ $eq: [{ $not: '$itinerary' }, true] }, true, false] },
														{ $eq: ['$status', ITINERARY_STATUS.PENDING] },
														{ $gt: [new Date(), '$plannedDate'] },
													],
												},
												then: ITINERARY_STATUS.CANCELLED,
											},
											{
												/*  Case: When itinerary is ONGOING & has reached its toDate
													& it will be completed provided it does not have cancellation
													request on it with an itineraryStatus COMPLETED */
												case: {
													$and: [
														{ $eq: ['$itinerary.itineraryStatus', ITINERARY_STATUS.ONGOING] },
														{ $not: '$itinerary.cancellationRequest' },
														{ $gt: [new Date(), '$itinerary.toDate'] },
													],
												},
												then: ITINERARY_STATUS.COMPLETED,
											},
			                            ],
										default: { $ifNull: ['$itinerary.itineraryStatus', '$status'] },
									},
								},
							},
						},
						{
							$sort: { plannedDate: -1 },
						},
						{
							$project: {
								userName: { $concat: ['$firstName', ' ', '$lastName'] },
								location: '$location',
								phoneNumber: '$contactNumber',
								numberOfGuests: '$travellers',
								plannedDate: '$plannedDate',
								endDate: '$endDate',
								plannedTraveller: '$plannedTraveller',
								status: {
									$cond: [{
										$and: [
											{ $eq: ['$updatedStatus', ITINERARY_STATUS.CANCELLED] },
											{ $not: '$itinerary.approved' },
											{ $not: '$itinerary.cancellationRequest' },
											{ $gt: [new Date(), '$itinerary.fromDate'] },
										],
									}, ITINERARY_STATUS.EXPIRED, '$updatedStatus'],
								},
							},
						},
						{
							$skip: (page - 1) * limit,
						},
						{
							$limit: limit,
						},
					],
					as: 'itinerary',
				},
			},
			{
				$project: {
					name: { $first: '$itinerary.userName' },
					image: '$image',
					itinerary: '$itinerary',
				},
			},
		]);

		return resolve(ResponseUtility.SUCCESS({ data }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
