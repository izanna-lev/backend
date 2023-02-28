/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ItineraryRequestModel, ItineraryModel } from '../../schemas';
import {
	HYPHEN,
	ITINERARY_STATUS,
	MONTH_ARRAY,
	PAGINATION_LIMIT,
} from '../../constants';

/**
* @description service model function to fetch the listing of all the assigned itineraries & details
* @author Pavleen Kaur
* @since 6 August, 2022
*/

export default ({
	id,
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		const [data] = await ItineraryRequestModel.aggregate([
			{
				$match: { specialistRef: Types.ObjectId(id) },
			},
			{
				$lookup: {
					from: 'travellers',
					let: { travellerRef: '$travellerRef' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$_id', '$$travellerRef'] },
									],
								},
							},
						},
					],
					as: 'traveller',
				},
			},
			{
				$unwind: { path: '$traveller', preserveNullAndEmptyArrays: true },
			},
			{
				$lookup: {
					from: 'itineraries',
					let: { formRef: '$_id', status: '$status' },
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
				$unwind: { path: '$itinerary', preserveNullAndEmptyArrays: true },
			},
			{
				$lookup: {
					from: 'blocks',
					let: {
						blockedUser: '$itinerary.specialistRef', blockedBy: '$itinerary.travellerRef', channelRef: '$itinerary._id',
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$or: [
										{
											$and: [
												{ $eq: ['$blockedBy', '$$blockedBy'] },
												{ $eq: ['$blockedUser', '$$blockedUser'] },
												{ $eq: ['$itineraryRef', '$$channelRef'] },
											],
										},

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
				$sort: { updatedAt: -1 },
			},
			{
				$project: {
					userName: { $concat: ['$firstName', ' ', '$lastName'] },
					contactNumber: '$contactNumber',
					travellerEmail: '$traveller.email',
					location: '$location',
					travellers: '$travellers',
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
					itineraryRef: { $ifNull: ['$itinerary._id', ''] },
					image: '$itinerary.image',
					phoneCode: '$phoneCode',
					approved: { $cond: [{ $eq: [{ $not: '$itinerary.approved' }, true] }, false, true] },
					previousStatus: '$previousStatus',
					updatedStatus: '$updatedStatus',
					itineraryStatus: {
						$cond: [{
							$and: [
								{ $eq: ['$updatedStatus', ITINERARY_STATUS.CANCELLED] },
								{ $not: '$itinerary.approved' },
								{ $not: '$itinerary.cancellationRequest' },
								{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$itinerary.fromDate'] },
							],
						}, ITINERARY_STATUS.EXPIRED, '$updatedStatus'],
					},
					blockedByTraveller: { $cond: [{ $eq: ['$block', []] }, false, true] },
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
