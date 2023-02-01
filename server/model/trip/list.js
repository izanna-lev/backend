/* eslint-disable import/named */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ItineraryModel, SpecialistModel, AdminModel } from '../../schemas';
import {
	PAGINATION_LIMIT, DEFAULT_DAY, RESERVATION_TYPE, TRANSPORTATION_TYPE,
} from '../../constants';
/**
* @description service model function to fetch the listing of
* all the trip summary of a specific Itinerary with Day Filter.
* @param {String} itineraryRef the _id of itinerary
* @param {Number} dayFilter for selecting a specific day of itinerary.Default is 1
* @author Pavleen Kaur
* @since 20 August, 2022
*/

export default ({
	id,
	type,
	itineraryRef,
	dayFilter = DEFAULT_DAY,
	page = 1,
	limit = PAGINATION_LIMIT,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!itineraryRef) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Missing prop itineraryRef' }));
		}
		const value = type === 'specialist'
			? await SpecialistModel.findOne({ _id: id })
			: await AdminModel.findOne({ _id: id });

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
									{
										$limit: 1,
									},
								],
								as: 'tickets',
							},
						},
						{
							$unwind: {
								path: '$tickets',
								preserveNullAndEmptyArrays: true,
							},
						},
					],
					as: 'transportation',
				},
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

					],
					as: 'reservation',
				},
			},
			{
				$lookup: {
					from: 'notes',
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

					],
					as: 'note',
				},
			},
			{
				$project: {
					departTrip: {
						$map: {
							input: {
								$filter:
								{
									input: '$transportation',
									cond: { $ne: ['$$transportation.transportationType', TRANSPORTATION_TYPE.CAR] },
									as: 'transportation',
								},
							},
							as: 'transportation',
							in: {
								transportRef: '$$transportation._id',
								title: { $concat: ['Departure from ', '$$transportation.depart.location'] },
								day: {
									$add: [{
										$dateDiff: {
											startDate: '$fromDate',
											endDate: '$$transportation.departDateTime',
											unit: 'day',
											timezone: value.zone,
										},
									}, 1],
								},
								image: '$$transportation.tickets.image',
								dateTime: '$$transportation.departDateTime',
								description: '$$transportation.specialistNote',
							},
						},
					},
					arrivalTrip: {
						$map: {
							input: {
								$filter:
								{
									input: '$transportation',
									cond: { $ne: ['$$transportation.transportationType', TRANSPORTATION_TYPE.CAR] },
									as: 'transportation',
								},
							},
							as: 'transportation',
							in: {
								transportRef: '$$transportation._id',
								title: { $concat: ['Arrival At ', '$$transportation.arrival.location'] },
								day: {
									$add: [{
										$dateDiff: {
											startDate: '$fromDate',
											endDate: '$$transportation.arrivalDateTime',
											unit: 'day',
											timezone: value.zone,
										},
									}, 1],
								},
								image: '$$transportation.tickets.image',
								dateTime: '$$transportation.arrivalDateTime',
								description: '$$transportation.specialistNote',
							},
						},
					},
					carTrip: {
						$map: {
							input: {
								$filter:
								{
									input: '$transportation',
									cond: { $eq: ['$$transportation.transportationType', TRANSPORTATION_TYPE.CAR] },
									as: 'transportation',
								},
							},
							as: 'transportation',
							in: {
								transportationRef: '$$transportation._id',
								title: { $concat: ['Pickup from  ', '$$transportation.depart.location'] },
								day: {
									$add: [{
										$dateDiff: {
											startDate: '$fromDate',
											endDate: '$$transportation.departDateTime',
											unit: 'day',
											timezone: value.zone,
										},
									}, 1],
								},
								image: '$$transportation.userCarDetails.carImage',
								dateTime: '$$transportation.departDateTime',
								description: '$$transportation.specialistNote',
							},
						},
					},
					checkInTrip: {
						$map: {
							input: {
								$filter:
								{
									input: '$reservation',
									cond: { $eq: ['$$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] },
									as: 'reservation',
								},
							},
							as: 'reservation',
							in: {
								reservationRef: '$$reservation._id',
								title: { $concat: ['Check In  ', '$$reservation.name'] },
								day: {
									$add: [{
										$dateDiff: {
											startDate: '$fromDate',
											endDate: '$$reservation.checkInDateTime',
											unit: 'day',
											timezone: value.zone,
										},
									}, 1],
								},
								image: '$$reservation.image',
								dateTime: '$$reservation.checkInDateTime',
								description: '$$reservation.description',
							},
						},
					},
					checkOutTrip: {
						$map: {
							input: {
								$filter:
								{
									input: '$reservation',
									cond: { $eq: ['$$reservation.reservationType', RESERVATION_TYPE.ACCOMMODATION] },
									as: 'reservation',
								},
							},
							as: 'reservation',
							in: {
								reservationRef: '$$reservation._id',
								title: { $concat: ['Check Out ', '$$reservation.name'] },
								day: {
									$add: [{
										$dateDiff: {
											startDate: '$fromDate',
											endDate: '$$reservation.checkOutDateTime',
											unit: 'day',
											timezone: value.zone,
										},
									}, 1],
								},
								image: '$$reservation.image',
								dateTime: '$$reservation.checkOutDateTime',
								description: '$$reservation.description',
							},
						},
					},
					restaurantTrip: {
						$map: {
							input: {
								$filter:
								{
									input: '$reservation',
									cond: { $eq: ['$$reservation.reservationType', RESERVATION_TYPE.RESTAURANT] },
									as: 'reservation',
								},
							},
							as: 'reservation',
							in: {
								transportRef: '$$reservation._id',
								title: '$$reservation.name',
								day: {
									$add: [{
										$dateDiff: {
											startDate: '$fromDate',
											endDate: '$$reservation.reservationDateTime',
											unit: 'day',
											timezone: value.zone,
										},
									}, 1],
								},
								image: '$$reservation.image',
								dateTime: '$$reservation.reservationDateTime',
								description: '$$reservation.description',
							},
						},
					},
					activityTrip: {
						$map: {
							input: {
								$filter:
								{
									input: '$reservation',
									cond: { $eq: ['$$reservation.reservationType', RESERVATION_TYPE.ACTIVITY] },
									as: 'reservation',
								},
							},
							as: 'reservation',
							in: {
								transportRef: '$$reservation._id',
								title: '$$reservation.name',
								day: {
									$add: [{
										$dateDiff: {
											startDate: '$fromDate',
											endDate: '$$reservation.reservationDateTime',
											unit: 'day',
											timezone: value.zone,
										},
									}, 1],
								},
								image: '$$reservation.image',
								dateTime: '$$reservation.reservationDateTime',
								description: '$$reservation.description',
							},
						},
					},
					noteTrip: {
						$map: {
							input: '$note',
							as: 'note',
							in: {
								title: 'Notes',
								day: {
									$dateDiff: {
										startDate: '$fromDate',
										endDate: {
											$subtract: [{
												$dateAdd: {
													startDate: '$fromDate',
													unit: 'day',
													amount: '$$note.day',
													timezone: value.zone,
												},
											}, 1],
										},
										unit: 'day',
										timezone: value.zone,
									},
								},
								image: '$$note.image',
								dateTime: {
									$dateTrunc: {
										date: {
											$subtract: [{
												$dateAdd: {
													startDate: '$fromDate',
													unit: 'day',
													amount: '$$note.day',
												},
											}, 1],
										},
										unit: 'day',
									},
								},
								description: '$$note.description',
							},
						},
					},
				},
			},
			{
				$addFields: {
					tripSummary: {
						$filter:
						{
							input: { $concatArrays: ['$departTrip', '$arrivalTrip', '$carTrip', '$checkInTrip', '$checkOutTrip', '$restaurantTrip', '$activityTrip', '$noteTrip'] },
							cond: { $eq: ['$$tripSummary.day', dayFilter] },
							as: 'tripSummary',
						},
					},
				},
			},
			{ $unwind: '$tripSummary' },
			{
				$project: {
					_id: 0,
					title: '$tripSummary.title',
					day: '$tripSummary.day',
					image: '$tripSummary.image',
					dateTime: '$tripSummary.dateTime',
					description: '$tripSummary.description',
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
