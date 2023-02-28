/* eslint-disable import/named */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ItineraryModel } from '../../schemas';
import {
	PAGINATION_LIMIT, RESERVATION_TYPE, ZERO, HYPHEN, MONTH_ARRAY,
} from '../../constants';
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
					checkInDate: {
						$cond: [{ $eq: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, {
							$concat: [{
								$toString: { $dayOfMonth: '$reservation.checkInDateTime' },
							}, HYPHEN, {
								$arrayElemAt: [
									MONTH_ARRAY,
									{ $month: '$reservation.checkInDateTime' },
								],
							}, HYPHEN, {
								$toString: { $year: '$reservation.checkInDateTime' },
							}],
						}, '$$REMOVE'],
					},
					checkInTime: {
						$cond: [{ $eq: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, {
							$concat: [{
								$toString: {
									$cond: [{
										$gt: [{
											$hour: {
												date: '$reservation.checkInDateTime',
											},
										}, 12],
									}, {
										$cond: [{
											$gt: [{
												$subtract: [{
													$hour: {
														date: '$reservation.checkInDateTime',
													},
												}, 12],
											}, 9],
										}, {
											$subtract: [{
												$hour: {
													date: '$reservation.checkInDateTime',
												},
											}, 12],
										}, {
											$concat: [ZERO, {
												$toString: {
													$subtract: [{
														$hour: {
															date: '$reservation.checkInDateTime',
														},
													}, 12],
												},
											}],
										}],
									}, { $dateToString: { format: '%H', date: '$reservation.checkInDateTime' } }],
								},
							}, ':', {
								$concat: [{ $dateToString: { format: '%M', date: '$reservation.checkInDateTime' } }, ' ', {
									$cond: [{
										$gte: [{
											$hour: {
												date: '$reservation.checkInDateTime',
											},
										}, 12],
									}, 'PM', 'AM'],
								}],
							}],
						}, '$$REMOVE'],
					},
					checkInDateTime: {
						$cond: [{ $eq: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, {
							$concat: [{
								$dateToString: {
									date: '$reservation.checkInDateTime',
									format: '%Y-%m-%d',
								},
							}, 'T', {
								$dateToString: {
									date: '$reservation.checkInDateTime',
									format: '%H:%M:%S',
								},
							}],
						}, '$$REMOVE'],
					},
					checkOutDate: {
						$cond: [{ $eq: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, {
							$concat: [{
								$toString: { $dayOfMonth: '$reservation.checkOutDateTime' },
							}, HYPHEN, {
								$arrayElemAt: [
									MONTH_ARRAY,
									{ $month: '$reservation.checkOutDateTime' },
								],
							}, HYPHEN, {
								$toString: { $year: '$reservation.checkOutDateTime' },
							}],
						}, '$$REMOVE'],
					},
					checkOutTime: {
						$cond: [{ $eq: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, {
							$concat: [{
								$toString: {
									$cond: [{
										$gt: [{
											$hour: {
												date: '$reservation.checkOutDateTime',
											},
										}, 12],
									}, {
										$cond: [{
											$gt: [{
												$subtract: [{
													$hour: {
														date: '$reservation.checkOutDateTime',
													},
												}, 12],
											}, 9],
										}, {
											$subtract: [{
												$hour: {
													date: '$reservation.checkOutDateTime',
												},
											}, 12],
										}, {
											$concat: [ZERO, {
												$toString: {
													$subtract: [{
														$hour: {
															date: '$reservation.checkOutDateTime',
														},
													}, 12],
												},
											}],
										}],
									}, { $dateToString: { format: '%H', date: '$reservation.checkOutDateTime' } }],
								},
							}, ':', {
								$concat: [{ $dateToString: { format: '%M', date: '$reservation.checkOutDateTime' } }, ' ', {
									$cond: [{
										$gte: [{
											$hour: {
												date: '$reservation.checkOutDateTime',
											},
										}, 12],
									}, 'PM', 'AM'],
								}],
							}],
						}, '$$REMOVE'],
					},
					checkOutDateTime: {
						$cond: [{ $eq: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, {
							$concat: [{
								$dateToString: {
									date: '$reservation.checkOutDateTime',
									format: '%Y-%m-%d',
								},
							}, 'T', {
								$dateToString: {
									date: '$reservation.checkOutDateTime',
									format: '%H:%M:%S',
								},
							}],
						}, '$$REMOVE'],
					},
					date: {
						$cond: [{ $ne: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, {
							$concat: [{
								$toString: { $dayOfMonth: '$reservation.reservationDateTime' },
							}, HYPHEN, {
								$arrayElemAt: [
									MONTH_ARRAY,
									{ $month: '$reservation.reservationDateTime' },
								],
							}, HYPHEN, {
								$toString: { $year: '$reservation.reservationDateTime' },
							}],
						}, '$$REMOVE'],
					},
					time: {
						$cond: [{ $ne: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, {
							$concat: [{
								$toString: {
									$cond: [{
										$gt: [{
											$hour: {
												date: '$reservation.reservationDateTime',
											},
										}, 12],
									}, {
										$cond: [{
											$gt: [{
												$subtract: [{
													$hour: {
														date: '$reservation.reservationDateTime',
													},
												}, 12],
											}, 9],
										}, {
											$subtract: [{
												$hour: {
													date: '$reservation.reservationDateTime',
												},
											}, 12],
										}, {
											$concat: [ZERO, {
												$toString: {
													$subtract: [{
														$hour: {
															date: '$reservation.reservationDateTime',
														},
													}, 12],
												},
											}],
										}],
									}, { $dateToString: { format: '%H', date: '$reservation.reservationDateTime' } }],
								},
							}, ':', {
								$concat: [{ $dateToString: { format: '%M', date: '$reservation.reservationDateTime' } }, ' ', {
									$cond: [{
										$gte: [{
											$hour: {
												date: '$reservation.reservationDateTime',
											},
										}, 12],
									}, 'PM', 'AM'],
								}],
							}],
						}, '$$REMOVE'],
					},
					dateTime: {
						$cond: [{ $ne: ['$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] }, {
							$concat: [{
								$dateToString: {
									date: '$reservation.reservationDateTime',
									format: '%Y-%m-%d',
								},
							}, 'T', {
								$dateToString: {
									date: '$reservation.reservationDateTime',
									format: '%H:%M:%S',
								},
							}],
						}, '$$REMOVE'],
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
