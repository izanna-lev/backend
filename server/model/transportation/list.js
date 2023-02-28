/* eslint-disable import/named */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ItineraryModel } from '../../schemas';
import {
	PAGINATION_LIMIT,
	TRANSPORTATION_TYPE,
	ZERO,
	HYPHEN,
	MONTH_ARRAY,
} from '../../constants';

/**
* @description service model function to fetch the listing of
* a specific transportation of a specific itinerary
* @param {String} itineraryRef the _id of the itinerary.
* @param {Number} transportationType the type of the transportation
* @author Pavleen Kaur
* @since 25 August, 2022
*/

export default ({
	itineraryRef,
	transportationType,
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!itineraryRef || !transportationType) {
			return reject(ResponseUtility.GENERIC_ERR({ message: `Missing property ${itineraryRef ? 'transportationType' : 'itineraryRef'}` }));
		}
		const [data] = await ItineraryModel.aggregate([
			{
				$match: { _id: Types.ObjectId(itineraryRef) },
			},
			{
				$lookup: {
					from: 'transportations',
					let: { itineraryRef: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$itineraryRef', '$$itineraryRef'] },
										{ $eq: ['$transportationType', transportationType] },
										{ $eq: ['$deleted', false] },
									],
								},
							},
						},
						{
							$lookup: {
								from: 'tickets',
								let: { transportationRef: '$_id' },
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													{ $eq: ['$transportationRef', '$$transportationRef'] },
													{ $eq: ['$deleted', false] },
												],
											},
										},
									},
								],
								as: 'tickets',
							},
						},

					],
					as: 'transportation',
				},
			},
			{
				$unwind: '$transportation',
			},
			{
				$project: {
					_id: '$transportation._id',
					day: '$transportation.day',
					airline: '$transportation.airline',
					flightClass: '$transportation.flightClass',
					trainClass: '$transportation.trainClass',
					specialistNote: '$transportation.specialistNote',
					depart: '$transportation.depart.location',
					arrival: '$transportation.arrival.location',
					departDate: {
						$concat: [{
							$toString: { $dayOfMonth: '$transportation.departDateTime' },
						}, HYPHEN, {
							$arrayElemAt: [
								MONTH_ARRAY,
								{ $month: '$transportation.departDateTime' },
							],
						}, HYPHEN, {
							$toString: { $year: '$transportation.departDateTime' },
						}],
					},
					departTime: {
						$concat: [{
							$toString: {
								$cond: [{
									$gt: [{
										$hour: {
											date: '$transportation.departDateTime',
										},
									}, 12],
								}, {
									$cond: [{
										$gt: [{
											$subtract: [{
												$hour: {
													date: '$transportation.departDateTime',
												},
											}, 12],
										}, 9],
									}, {
										$subtract: [{
											$hour: {
												date: '$transportation.departDateTime',
											},
										}, 12],
									}, {
										$concat: [ZERO, {
											$toString: {
												$subtract: [{
													$hour: {
														date: '$transportation.departDateTime',
													},
												}, 12],
											},
										}],
									}],
								}, { $dateToString: { format: '%H', date: '$transportation.departDateTime' } }],
							},
						}, ':', {
							$concat: [{ $dateToString: { format: '%M', date: '$transportation.departDateTime' } }, ' ', {
								$cond: [{
									$gte: [{
										$hour: {
											date: '$transportation.departDateTime',
										},
									}, 12],
								}, 'PM', 'AM'],
							}],
						}],
					},
					arrivalDate: {
						$cond: [{ $eq: [transportationType, TRANSPORTATION_TYPE.CAR] }, '$$REMOVE', {
							$concat: [{
								$toString: { $dayOfMonth: '$transportation.arrivalDateTime' },
							}, HYPHEN, {
								$arrayElemAt: [
									MONTH_ARRAY,
									{ $month: '$transportation.arrivalDateTime' },
								],
							}, HYPHEN, {
								$toString: { $year: '$transportation.arrivalDateTime' },
							}],
						}],
					},
					arrivalTime: {
						$cond: [{ $eq: [transportationType, TRANSPORTATION_TYPE.CAR] }, '$$REMOVE', {
							$concat: [{
								$toString: {
									$cond: [{
										$gt: [{
											$hour: {
												date: '$transportation.arrivalDateTime',
											},
										}, 12],
									}, {
										$cond: [{
											$gt: [{
												$subtract: [{
													$hour: {
														date: '$transportation.arrivalDateTime',
													},
												}, 12],
											}, 9],
										}, {
											$subtract: [{
												$hour: {
													date: '$transportation.arrivalDateTime',
												},
											}, 12],
										}, {
											$concat: [ZERO, {
												$toString: {
													$subtract: [{
														$hour: {
															date: '$transportation.arrivalDateTime',
														},
													}, 12],
												},
											}],
										}],
									}, { $dateToString: { format: '%H', date: '$transportation.arrivalDateTime' } }],
								},
							}, ':', {
								$concat: [{ $dateToString: { format: '%M', date: '$transportation.arrivalDateTime' } }, ' ', {
									$cond: [{
										$gte: [{
											$hour: {
												date: '$transportation.arrivalDateTime',
											},
										}, 12],
									}, 'PM', 'AM'],
								}],
							}],
						}],
					},
					departDateTime: {
						$concat: [{
							$dateToString: {
								date: '$transportation.departDateTime',
								format: '%Y-%m-%d',
							},
						}, 'T', {
							$dateToString: {
								date: '$transportation.departDateTime',
								format: '%H:%M:%S',
							},
						}],
					},
					arrivalDateTime: {
						$cond: [{ $eq: [transportationType, TRANSPORTATION_TYPE.CAR] }, '$$REMOVE', {
							$concat: [{
								$dateToString: {
									date: '$transportation.arrivalDateTime',
									format: '%Y-%m-%d',
								},
							}, 'T', {
								$dateToString: {
									date: '$transportation.arrivalDateTime',
									format: '%H:%M:%S',
								},
							}],
						}],
					},
					userCarDetails: { $cond: [{ $eq: [transportationType, TRANSPORTATION_TYPE.CAR] }, '$transportation.userCarDetails', '$$REMOVE'] },
					tickets: '$transportation.tickets',
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
