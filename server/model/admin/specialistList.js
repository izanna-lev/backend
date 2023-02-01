/* eslint-disable no-async-promise-executor */
/* eslint-disable import/named */
/* eslint-disable no-promise-executor-return */
import { ResponseUtility } from 'appknit-backend-bundle';
import { SpecialistModel } from '../../schemas';
import { PAGINATION_LIMIT } from '../../constants';
// import { delete } from 'request-promise';

/**
* @description service model function to fetch the listing of the users
* @author Abhinav Sharma
* @since 10 March, 2021
*/

export default ({
	text = '',
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		const andQuery = [
			{ deleted: false },
			{ blocked: false },
		];

		if (text.trim()) {
			andQuery.push(
				{
					$or: [
						{ email: new RegExp(text, 'i') },
						{ name: new RegExp(text, 'i') },
					],
				},

			);
		}

		const listQuery = [
			{
				$match: {
					$and: andQuery,
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
										{ $eq: ['$specialistRef', '$$id'] },
									],
								},
							},
						},
					],
					as: 'itinerary',
				},
			},
			{
				$sort: {
					createdAt: -1,
				},
			},
			{
				$project: {
					name: '$name',
					email: '$email',
					image: '$image',
					itineryCount: { $ifNull: [{ $size: '$itinerary' }, 0] },
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
		];

		const [data] = await SpecialistModel.aggregate(listQuery);

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
