/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable import/named */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { NoteModel } from '../../schemas';
import { PAGINATION_LIMIT } from '../../constants';

/**
* @description service model function to fetch the listing of all notes
* @author Pavleen Kaur
* @since 29 August, 2022
*/

export default ({
	itineraryRef,
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		const [data] = await NoteModel.aggregate([
			{
				$match: { itineraryRef: Types.ObjectId(itineraryRef), deleted: false },
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
