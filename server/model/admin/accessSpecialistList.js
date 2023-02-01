/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-async-promise-executor */
/* eslint-disable import/named */
/* eslint-disable no-promise-executor-return */
import { ResponseUtility } from 'appknit-backend-bundle';
import { SpecialistModel } from '../../schemas';
import { ITINERARY_STATUS, PAGINATION_LIMIT } from '../../constants';

export default ({
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		// console.time('test');
		const [data] = await SpecialistModel.aggregate([
			{ $match: { deleted: false } },
			{
				$lookup: {
					from: 'itineraries',
					let: { specialistRef: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$specialistRef', '$$specialistRef'] },
										{ $eq: ['$itineraryStatus', ITINERARY_STATUS.COMPLETED] },
									],
								},
							},
						},
						{
							$group: {
								_id: '$specialistRef',
								completedItineraries: { $count: {} },
								averageRatings: { $avg: { $divide: [{ $add: ['$rating.experience', '$rating.specialist', '$rating.value'] }, 3] } },
							},
						},
					],
					as: 'itinerary',
				},
			},
			{ $unwind: { path: '$itinerary', preserveNullAndEmptyArrays: true } },
			{
				$project: {
					name: '$name',
					email: '$email',
					phoneNumber: '$phoneNumber',
					image: '$image',
					blocked: '$blocked',
					phoneCode: '$phoneCode',
					completedItineraries: '$itinerary.completedItineraries',
				    averageRatings: { $round: ['$itinerary.averageRatings', 2] },
					permissions: '$access',
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
