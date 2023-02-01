/* eslint-disable import/named */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ItineraryRequestModel } from '../../schemas';
import { ITINERARY_STATUS, PAGINATION_LIMIT } from '../../constants';

/**
* @description service model function to fetch the listing of cancel Requests by traveller.
* @author Pavleen Kaur
* @since 7 Sept, 2022
*/

export default ({
	id,
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		const [data] = await ItineraryRequestModel.aggregate([
			{ $match: { specialistRef: Types.ObjectId(id) } },
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
										{
											$or: [
												{
													$and: [
														{ $eq: ['$itineraryStatus', ITINERARY_STATUS.UPCOMING] },
														{ $ne: [{ $ifNull: ['$cancellationRequest', ''] }, ''] },
													],
												},
												{ $eq: ['$itineraryStatus', ITINERARY_STATUS.CANCELLED] },
											],
										},
									],
								},
							},
						},
					],
					as: 'itinerary',
				},
			},
			{
				$unwind: '$itinerary',
			},
			{
				$lookup: {
					from: 'travellers',
					let: { travellerRef: '$itinerary.travellerRef' },
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
				$unwind: '$traveller',
			},
			{
				$sort: { 'itinerary.cancellationRequest': -1 },
			},
			{
				$project: {
					name: { $ifNull: ['$itinerary.name', '$location'] },
					image: '$itinerary.image',
					itineraryRef: '$itinerary._id',
					userName: { $concat: ['$firstName', ' ', '$lastName'] },
					guests: '$itinerary.guests',
					email: '$traveller.email',
					cancellationRequestDate: '$itinerary.cancellationRequest',
					cancelled: { $cond: [{ $eq: ['$itinerary.itineraryStatus', ITINERARY_STATUS.CANCELLED] }, true, false] },
					assignedDate: '$updatedAt',
					channelRef: '$itinerary._id',
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
