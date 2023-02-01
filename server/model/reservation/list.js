/* eslint-disable import/named */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ItineraryModel } from '../../schemas';
import { PAGINATION_LIMIT, RESERVATION_TYPE } from '../../constants';
/**
* @description service model function to fetch the listing of
* a specific reservation of a specific itinerary
* @param {String} itineraryRef the _id of the itinerary.
* @param {Number} reservationType the type of the reservation(Accomodation,Activity,Restaurant)
* @author Pavleen Kaur
* @since 8 August, 2022
*/

export default ({
	itineraryRef,
	reservationType,
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!itineraryRef || !reservationType) {
			return reject(ResponseUtility.GENERIC_ERR({ message: `Missing property ${itineraryRef ? 'reservationType' : 'itineraryRef'}` }));
		}
		const [data] = await ItineraryModel.aggregate([
			{
				$match: { _id: Types.ObjectId(itineraryRef) },
			},
			{
				$lookup: {
					from: 'reservations',
					let: { itineraryRef: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$itineraryRef', '$$itineraryRef'] },
										{ $eq: ['$reservationType', reservationType] },
										{ $eq: ['$deleted', false] },
									],
								},
							},
						},

					],
					as: 'reservation',
				},
			},
			{
				$unwind: '$reservation',
			},
			{
				$project: {
					_id: '$reservation._id',
					day: '$reservation.day',
					name: '$reservation.name',
					image: '$reservation.image',
					location: '$reservation.location',
					contactNumber: '$reservation.contactNumber',
					phoneCode: '$reservation.phoneCode',
					description: '$reservation.description',
					checkInDateTime: { $cond: [{ $eq: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, '$reservation.checkInDateTime', '$$REMOVE'] },
					checkOutDateTime: { $cond: [{ $eq: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, '$reservation.checkOutDateTime', '$$REMOVE'] },
					dateTime: { $cond: [{ $ne: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, '$reservation.reservationDateTime', '$$REMOVE'] },
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
