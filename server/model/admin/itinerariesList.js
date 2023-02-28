/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/named */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-promise-executor-return */
import { ResponseUtility } from 'appknit-backend-bundle';
import { ItineraryModel, ItineraryRequestModel } from '../../schemas';
import {
	ITINERARY_STATUS,
	PAGINATION_LIMIT,
	MONTH_ARRAY,
	HYPHEN,
} from '../../constants';
// import { delete } from 'request-promise';

/**
* @description service model function to fetch the listing of the itineraries
* @author Abhinav Sharma
* @since 10 March, 2021
*/

export default ({
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		// console.time('test');
		const [data] = await ItineraryRequestModel.aggregate([
			{
				$lookup: {
					from: 'itineraries',
					let: { formRef: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$formRef', '$$formRef'] },
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
				$lookup: {
					from: 'travellers',
					let: { id: '$travellerRef' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$_id', '$$id'] },
									],
								},
							},
						},
					],
					as: 'traveller',
				},
			},
			{
				$unwind: '$traveller',
			},
			{
				$lookup: {
					from: 'specialists',
					let: {
						id: '$specialistRef',
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$_id', '$$id'] },
									],
								},
							},
						},
					],
					as: 'specialist',
				},
			},
			{
				$unwind: {
					path: '$specialist',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'blocks',
					let: {
						itineraryRef: '$itinerary._id',
						blockedBy: '$itinerary.travellerRef',
						blockedUser: '$itinerary.specialistRef',
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$blockedBy', '$$blockedBy'] },
										{ $eq: ['$blockedUser', '$$blockedUser'] },
										{ $eq: ['$itineraryRef', '$$itineraryRef'] },
									],
								},
							},
						},
					],
					as: 'block',
				},
			},
			{
				$addFields: {
					previousStatus: { $ifNull: ['$itinerary.itineraryStatus', '$status'] },
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
											{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$itinerary.fromDate'] },
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
											{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), { $ifNull: ['$itinerary.fromDate', '$plannedDate'] }] },
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
											{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$plannedDate'] },
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
											{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$itinerary.toDate'] },
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
				$sort: { createdAt: -1 },
			},
			{
				$project: {
					itineraryRef: { $ifNull: ['$itinerary._id', ''] },
					formRef: '$_id',
					travellers: '$travellers',
					location: '$location',
					userName: { $concat: ['$firstName', ' ', '$lastName'] },
					contactNumber: '$contactNumber',
					plannedDate: {
						$concat: [{
							$toString: { $dayOfMonth: '$plannedDate' },
						}, HYPHEN, {
							$arrayElemAt: [
								MONTH_ARRAY,
								{ $month: '$plannedDate' },
							],
						}, HYPHEN, {
							$toString: { $year: '$plannedDate' },
						}],
					},
					endDate: {
						$concat: [{
							$toString: { $dayOfMonth: '$plannedDate' },
						}, HYPHEN, {
							$arrayElemAt: [
								MONTH_ARRAY,
								{ $month: '$plannedDate' },
							],
						}, HYPHEN, {
							$toString: { $year: '$plannedDate' },
						}],
					},
					plannedTraveller: '$plannedTraveller',
					specialistRef: { $ifNull: ['$specialist._id', ''] },
					specialistName: { $ifNull: ['$specialist.name', ''] },
					blockedByTraveller: { $cond: [{ $eq: ['$block', []] }, false, true] },
					previousStatus: '$previousStatus',
					updatedStatus: '$updatedStatus',
					phoneCode: '$phoneCode',
					status: {
						$cond: [{
							$and: [
								{ $eq: ['$updatedStatus', ITINERARY_STATUS.CANCELLED] },
								{ $not: '$itinerary.approved' },
								{ $not: '$itinerary.cancellationRequest' },
								{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$itinerary.fromDate'] },
							],
						}, ITINERARY_STATUS.EXPIRED, '$updatedStatus'],
					},
				},
			},
			{
				$facet: {
					list: [
						{
							$skip: (page - 1) * limit,
						},
						{
							$limit: limit,
						},
					],
					total: [
						{
							$count: 'count',
						},
					],
				},
			},
			{
				$unwind: '$total',
			},
		]);
		if (data) {
			for (let i = 0; i < data.list.filter(obj => obj).length; i += 1) {
				if (data.list[i].previousStatus !== data.list[i].updatedStatus) {
					if (data.list[i].itineraryRef !== '') {
						await ItineraryModel.updateOne(
							{ _id: data.list[i].itineraryRef },
							{ itineraryStatus: data.list[i].updatedStatus },
						);
					}
				}
			}
		}
		// console.timeLog('test');
		return resolve(ResponseUtility.SUCCESS({
			data: {
				list: ((data || {}).list || []),
				page,
				limit,
				total: (((data || {}).total || {}).count || 0),
				size: ((data || {}).list || []).length,
				hasMore: ((data || {}).list || []).length === limit,
			},
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
