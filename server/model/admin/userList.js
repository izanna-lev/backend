/* eslint-disable import/named */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-promise-executor-return */
import { ResponseUtility } from 'appknit-backend-bundle';
import { TravellerModel } from '../../schemas';
import { PAGINATION_LIMIT } from '../../constants';

/**
* @description service model function to fetch the listing of the travellers
* @author Abhinav Sharma
* @since 10 March, 2021
*/

export default ({
	text = '',
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		// console.time('test');
		const andQuery = [
			{ deleted: false },
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

		const [data] = await TravellerModel.aggregate([
			{
				$match: {
					$and: andQuery,
				},
			},
			{
				$project: {
					name: '$name',
					email: '$email',
					image: { $ifNull: ['$image', ''] },
					blocked: '$blocked',
				},
			},
			{
				$sort: {
					createdOn: -1,
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
