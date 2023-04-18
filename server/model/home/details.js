/* eslint-disable max-len */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-unused-vars */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import {
	ItineraryModel,
} from '../../schemas';
import {
	DETAIL_TYPE,
	ITINERARY_STATUS,
	RESERVATION_TYPE,
	TRANSPORTATION_TYPE,
	MILLISECOND_EQUIVALENT,
	HOUR,
} from '../../constants';
/**
* @description service model function to handle the itinerary details
* @author Pavleen Kaur
* @since 03 August, 2022
*/

export default ({
	id,
	itineraryRef,
	// date,
	// timezone,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!itineraryRef) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing Property itineraryRef' }));
		}
		const checkItinerary = await ItineraryModel.findOne({ _id: itineraryRef, travellerRef: id });
		if (!checkItinerary) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid itineraryRef!' }));
		}
		// let filterDate;
		// if (date) {
		// 	filterDate = new Date(date);
		// }

		const [itinerary] = await ItineraryModel.aggregate([
			{
				$match: {
					travellerRef: Types.ObjectId(id),
					_id: Types.ObjectId(itineraryRef),
				},
			},
			{
				$lookup: {
					from: 'specialists',
					let: { specialistRef: '$specialistRef' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$_id', '$$specialistRef'] },
										{ $eq: ['$deleted', false] },
									],
								},
							},
						},
					],
					as: 'specialist',
				},
			},
			{
				$unwind: { path: '$specialist', preserveNullAndEmptyArrays: true },
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
										{ $eq: ['$deleted', false] },
									],
								},
							},
						},
						{
							$addFields: {
								date: {
									$cond: [
										{ $eq: ['$reservationType', RESERVATION_TYPE.ACCOMMODATION] },
										['$checkInDateTime', '$checkOutDateTime'],
										['$reservationDateTime'],
									],
								},
								detailType: {
									$switch: {
										branches: [
											{
												case: { $eq: ['$reservationType', RESERVATION_TYPE.ACCOMMODATION] },
												then: DETAIL_TYPE.ACCOMMODATION,
											},
											{
												case: { $eq: ['$reservationType', RESERVATION_TYPE.ACCOMMODATION] },
												then: DETAIL_TYPE.ACCOMMODATION,
											},
											{
												case: { $eq: ['$reservationType', RESERVATION_TYPE.RESTAURANT] },
												then: DETAIL_TYPE.RESTAURANT,
											},
											{
												case: { $eq: ['$reservationType', RESERVATION_TYPE.ACTIVITY] },
												then: DETAIL_TYPE.ACTIVITY,
											},
										],
										default: '$reservationType',
									},
								},
							},
						},
						{
							$unwind: '$date',
						},
					],
					as: 'reservation',
				},
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
						{
							$addFields: {
								date: '$departDateTime',
								hourMinute: {
									$abs: {
										$divide: [{
											$dateDiff: {
												startDate: '$departDateTime',
												endDate: '$arrivalDateTime',
												unit: 'millisecond',
												// timezone,
											},
										}, MILLISECOND_EQUIVALENT],
									},
								},
								hour: {
									$abs: {
										$round: [{
											$divide: [{
												$dateDiff: {
													startDate: '$departDateTime',
													endDate: '$arrivalDateTime',
													unit: 'millisecond',
													// timezone,
												},
											}, MILLISECOND_EQUIVALENT],
										}, 0],
									},
								},
								minute: {
									$abs: {
										$multiply: [{
											$subtract: [
												{
													$abs: {
														$divide: [{
															$dateDiff: {
																startDate: '$departDateTime',
																endDate: '$arrivalDateTime',
																unit: 'millisecond',
																// timezone,
															},
														}, MILLISECOND_EQUIVALENT],
													},
												}, {
													$abs: {
														$round: [{
															$divide: [{
																$dateDiff: {
																	startDate: '$departDateTime',
																	endDate: '$arrivalDateTime',
																	unit: 'millisecond',
																	// timezone,
																},
															}, MILLISECOND_EQUIVALENT],
														}, 0],
													},
												}],
										}, HOUR],
									},
								},
								detailType: {
									$switch: {
										branches: [
											{
												case: { $eq: ['$transportationType', TRANSPORTATION_TYPE.FLIGHT] },
												then: DETAIL_TYPE.FLIGHT,
											},
											{
												case: { $eq: ['$transportationType', TRANSPORTATION_TYPE.FERRY] },
												then: DETAIL_TYPE.FERRY,
											},
											{
												case: { $eq: ['$transportationType', TRANSPORTATION_TYPE.TRAIN] },
												then: DETAIL_TYPE.TRAIN,
											},
											{
												case: { $eq: ['$transportationType', TRANSPORTATION_TYPE.CAR] },
												then: DETAIL_TYPE.CAR,
											},
										],
										default: '$transportationType',
									},
								},
							},
						},
					],
					as: 'itinerary',
				},
			},
			{
				$lookup: {
					from: 'notes',
					let: { itineraryRef: '$_id', fromDate: '$fromDate' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$itineraryRef', '$$itineraryRef'] },
										{ $eq: ['$deleted', false] },
									],
								},
							},
						},
						{
							$addFields: {
								date: {
									$dateTrunc: {
										date: {
											$subtract: [{
												$dateAdd: {
													startDate: '$$fromDate',
													unit: 'day',
													amount: '$day',
												},
											}, 1],
										},
										unit: 'day',
									// binSize: 1,
									},
								},
								// {
								// 	$dateAdd: {
								// 		startDate: {
								// 			$dateTrunc: {
								// 				date: {
								// 					$subtract: [{
								// 						$dateAdd: {
								// 							startDate: '$$fromDate',
								// 							unit: 'day',
								// 							amount: '$day',
								// 						},
								// 					}, 1],
								// 				},
								// 				unit: 'hour',
								// 				// binSize: 1,
								// 			},
								// 		},
								// 		unit: 'minute',
								// 		amount: 59,
								// 	},
								// },
								detailType: DETAIL_TYPE.NOTE,
							},
						},
					],
					as: 'note',
				},
			},
			{
				$addFields: {
					itinerary: { $concatArrays: ['$itinerary', '$reservation', '$note'] },
				},
			},
			{
				$unset: [
					'reservation', 'note',
				],
			},
			{ $unwind: { path: '$itinerary', preserveNullAndEmptyArrays: true } },
			{
				$addFields: {
					'itinerary.departDateTime': {
						$cond: [
							{
								$or: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FLIGHT] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.TRAIN] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FERRY] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.CAR] },
								],
							}, {
								$dateToString: {
									date: '$itinerary.departDateTime',
									// timezone,
								},
							}, '$$REMOVE'],
					},
					'itinerary.arrivalDateTime': {
						$cond: [
							{
								$or: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FLIGHT] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.TRAIN] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FERRY] },
								],
							}, {
								$dateToString: {
									date: '$itinerary.arrivalDateTime',
									// timezone,
								},
							}, '$$REMOVE'],
					},
					'itinerary.reservationDateTime': {
						$cond: [
							{
								$or: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.RESTAURANT] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.ACTIVITY] },
								],
							}, {
								$dateToString: {
									date: '$itinerary.reservationDateTime',
									// timezone,
								},
							}, '$$REMOVE'],
					},
					'itinerary.checkOutDateTime': {
						$cond: [
							{
								$and: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.ACCOMMODATION] },
								],
							}, {
								$dateToString: {
									date: '$itinerary.checkOutDateTime',
									// timezone,
								},
							}, '$$REMOVE'],
					},
					'itinerary.checkInDateTime': {
						$cond: [
							{
								$and: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.ACCOMMODATION] },
								],
							}, {
								$dateToString: {
									date: '$itinerary.checkInDateTime',
									// timezone,
								},
							}, '$$REMOVE'],
					},
					'itinerary.date': {
						$cond: [{ $eq: ['$itinerary.detailType', DETAIL_TYPE.NOTE] }, {
							$toDate: {
								$dateToString: {
									date: '$itinerary.date',
								},
							},
						}, {
							$toDate: {
								$dateToString: {
									date: '$itinerary.date',
									// timezone,
								},
							},
						}],
					},
					'itinerary.detailType': {
						$cond: [
							{
								$and: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.ACCOMMODATION] },
									{ $eq: ['$itinerary.date', '$itinerary.checkOutDateTime'] },
								],
							}, DETAIL_TYPE.CHECK_OUT, '$itinerary.detailType'],
					},
					'itinerary.location': {
						$cond: [
							{
								$or: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FLIGHT] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FERRY] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.TRAIN] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.CAR] },
								],
							}, {
								$cond: [{
									$eq: [{
										$dateToString: {
											date: '$itinerary.departDateTime',
											// timezone,
										},
									}, {
										$dateToString: {
											date: '$itinerary.date',
											// timezone,
										},
									}],
								}, '$itinerary.depart.location', '$itinerary.arrival.location'],
							}, '$itinerary.location.location'],
					},
					'itinerary.coordinates': {
						$cond: [
							{
								$or: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FLIGHT] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FERRY] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.TRAIN] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.CAR] },
								],
							}, {
								$cond: [{
									$eq: [{
										$dateToString: {
											date: '$itinerary.departDateTime',
											// timezone,
										},
									}, {
										$dateToString: {
											date: '$itinerary.date',
											// timezone,
										},
									}],
								}, '$itinerary.depart.coordinates', '$itinerary.arrival.coordinates'],
							}, '$itinerary.location.coordinates'],
					},
					'itinerary.departCoordinates': {
						$cond: [
							{
								$or: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FLIGHT] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FERRY] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.TRAIN] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.CAR] },
								],
							}, '$itinerary.depart.coordinates', '$$REMOVE'],
					},
					'itinerary.arrivalCoordinates': {
						$cond: [
							{
								$or: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FLIGHT] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FERRY] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.TRAIN] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.CAR] },
								],
							}, '$itinerary.arrival.coordinates', '$$REMOVE'],
					},
					'itinerary.departLocation': {
						$cond: [
							{
								$or: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FLIGHT] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FERRY] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.TRAIN] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.CAR] },
								],
							}, '$itinerary.depart.location', '$$REMOVE'],
					},
					'itinerary.arrivalLocation': {
						$cond: [
							{
								$or: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FLIGHT] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FERRY] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.TRAIN] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.CAR] },
								],
							}, '$itinerary.arrival.location', '$$REMOVE'],
					},
					'itinerary.transportDuration': {
						$cond: [
							{
								$or: [
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FLIGHT] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.FERRY] },
									{ $eq: ['$itinerary.detailType', DETAIL_TYPE.TRAIN] },
								],
							}, {
								$concat: [{ $toString: '$itinerary.hour' }, {
									$cond: [{
										$gte: ['$itinerary.hourMinute', 2],
									}, 'hrs', 'hr'],
								}, ' ', { $toString: '$itinerary.minute' }, ' ', 'min'],
							}, '$$REMOVE'],
					},
					'itinerary.hour': '$$REMOVE',
					'itinerary.minute': '$$REMOVE',
					'itinerary.hourMinute': '$$REMOVE',
					'itinerary.depart': '$$REMOVE',
					'itinerary.arrival': '$$REMOVE',
				},
			},
			{ $sort: { 'itinerary.date': -1 } },
			{
				$addFields: {
					dates: {
						$map: {
							input: { $range: [0, '$duration'] },
							as: 'this',
							in: {
								$let: {
									vars: { setDate: '$fromDate' },
									in: {
										$dateToString: {
											date: {
												$dateAdd: {
													startDate: '$$setDate',
													unit: 'day',
													amount: '$$this',
													// timezone,
												},
											},
											format: '%Y-%m-%d',
										},
									},
								},
							},

						},
					},
				},
			},
			{
				$lookup: {
					from: 'cards',
					let: { userRef: '$travellerRef' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$userRef', '$$userRef'] },
										{ $eq: ['$deleted', false] },
									],
								},
							},
						},
						{ $limit: 1 },
					],
					as: 'cards',
				},
			},
			{ $unwind: { path: '$cards', preserveNullAndEmptyArrays: true } },
			{
				$group: {
					_id: '$_id',
					name: { $first: '$name' },
					price: { $first: '$price' },
					image: { $first: '$image' },
					dates: { $first: '$dates' },
					isRated: { $first: { $cond: [{ $not: '$rating' }, false, true] } },
					card: { $first: { $cond: [{ $not: '$cards' }, false, true] } },
					approved: { $first: { $cond: [{ $not: '$approved' }, false, true] } },
					specialistRef: { $first: '$specialistRef' },
					adminRef: { $first: { $ifNull: ['$adminRef', ''] } },
					specialistName: { $first: '$specialist.name' },
					cancellationRequest: { $first: { $ne: [{ $ifNull: ['$cancellationRequest', ''] }, ''] } },
					itineraryStatus: {
						$first: {
							$switch: {
								branches: [
									{
										/*  Case: When itinerary is UPCOMING & it lies between its fromDate
											and toDate then it will be ONGOING provided it should not have
											the cancellation request on it  */
										case: {
											$and: [
												{ $eq: [{ $not: '$approved' }, false] },
												{ $eq: ['$itineraryStatus', ITINERARY_STATUS.UPCOMING] },
												{ $lt: [new Date(), '$toDate'] },
												{ $gt: [new Date(), '$fromDate'] },
												{ $not: '$cancellationRequest' },
											],
										},
										then: ITINERARY_STATUS.ONGOING,
									},
									{
										/*  Case: When itinerary is ONGOING & has reached its toDate
											& does not have request cancellation on it.
											with an itineraryStatus COMPLETED */
										case: {
											$and: [
												{ $eq: ['$itineraryStatus', ITINERARY_STATUS.ONGOING] },
												{ $not: '$cancellationRequest' },
												{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$toDate'] },
											],
										},
										then: ITINERARY_STATUS.COMPLETED,
									},
									{
										/*  Case: When itinerary is UPCOMING & has reached its fromDate
											& not approved by the traveller yet and it will be expired
											with an itineraryStatus CANCELLED */
										case: {
											$and: [
												{ $eq: ['$itineraryStatus', ITINERARY_STATUS.UPCOMING] },
												{ $not: '$approved' },
												{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$fromDate'] },
											],
										},
										then: ITINERARY_STATUS.CANCELLED,
									},
								],
								default: '$itineraryStatus',
							},
						},
					},
					additionalInformation: { $first: '$specificRestrictionsAndRegulations' },
					itinerary: {
						$push: '$itinerary',
						// {
						// 	$cond: [
						// 		{
						// 			$eq: [
						// 				{
						// 					$dateToString: {
						// 						date: '$itinerary.date',
						// 						format: '%Y-%m-%d',
						// 					},
						// 				},
						// 				{
						// 					$dateToString: {
						// 						date: {
						// 							$ifNull: [
						// 								filterDate,
						// 								'$fromDate',
						// 							],
						// 						},
						// 						format: '%Y-%m-%d',
						// 					},
						// 				},
						// 			],
						// 		},
						// 		'$itinerary',
						// 		'$$REMOVE',
						// 	],
						// },
					},
				},
			},
		]);
		if (itinerary.itineraryStatus === ITINERARY_STATUS.COMPLETED) {
			const itineraryData = await ItineraryModel.findOne({ _id: itineraryRef });
			if (itineraryData.rating) {
				itineraryData._doc.avgRating = Number((
					(itineraryData.rating.experience + itineraryData.rating.specialist + itineraryData.rating.value) / 3
				).toFixed(2));
			}
			itinerary.rating = itineraryData._doc.avgRating || 0;
		}
		return resolve(ResponseUtility.SUCCESS({ data: itinerary, message: 'Itinerary details fetched Sucessfully!' }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
