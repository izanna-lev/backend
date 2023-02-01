/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable import/named */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { TravellerModel } from '../../schemas';
import { PAGINATION_LIMIT } from '../../constants';
/**
* @description service model function to fetch the listing of travellers
* @author Pavleen Kaur
* @since 9 September, 2022
*/

export default ({
	id,
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		const [data] = await TravellerModel.aggregate([
			{ $match: { deleted: false, blocked: false } },
			{
				$lookup: {
					from: 'itineraryrequests',
					let: {
						travellerRef: '$_id',
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$travellerRef', '$$travellerRef'] },
										{ $eq: ['$specialistRef', Types.ObjectId(id)] },
									],
								},
							},
						},
						{ $limit: 1 },
					],
					as: 'traveller',
				},
			},
			{ $unwind: '$traveller' },
			{
				$project: {
					name: { $concat: ['$traveller.firstName', ' ', '$traveller.lastName'] },
					image: '$image',
					email: '$email',
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
		// const [data] = await ItineraryRequestModel.aggregate([
		// 	{ $match: { specialistRef: Types.ObjectId(id) } },
		// 	{
		// 		$lookup: {
		// 			from: 'travellers',
		// 			let: {
		// 				travellerRef: '$travellerRef',
		// 				firstName: '$firstName',
		// 				lastName: '$lastName',
		// 			},
		// 			pipeline: [
		// 				{
		// 					$match: {
		// 						$expr: {
		// 							$and: [
		// 								{ $eq: ['$_id', '$$travellerRef'] },
		// 								{ $eq: ['$deleted', false] },
		// 								{ $eq: ['$blocked', false] },
		// 							],
		// 						},
		// 					},
		// 				},
		// 				{
		// 					$group: {
		// 						_id: '$email',
		// 						traveller: {
		// 							$addToSet: '$email',
		// 						},
		// 					},
		// 				},
		// 			],
		// 			as: 'traveller',
		// 		},
		// 	},
		// 	{
		// 		$facet: {
		// 			list: [
		// 				{
		// 					$skip: (page - 1) * limit,
		// 				},
		// 				{
		// 					$limit: limit,
		// 				},
		// 			],
		// 			total: [
		// 				{
		// 					$count: 'count',
		// 				},
		// 			],
		// 		},
		// 	},
		// 	{
		// 		$unwind: '$total',
		// 	},
		// ]);
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
