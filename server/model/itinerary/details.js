/* eslint-disable no-undef */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable import/named */
import { ResponseUtility } from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import { ItineraryRequestModel } from '../../schemas';
import { ITINERARY_DEFAULT_VALUES, ITINERARY_STATUS, ITINERARY_TYPE } from '../../constants';


/**
* @description service model function to fetch the details of an assigned itinerary.
* @author Pavleen Kaur
* @since 7 Sept, 2022
*/

export default ({
	type,
	formRef,
}) => new Promise(async (resolve, reject) => {
	try {
		let date = new Date();
		date = new Date(`${date.toISOString().split('T')[0]}T00:00:00.000Z`);

		if (!formRef) {
			return reject(ResponseUtility.MISSING_PROPS({ message: 'Missing Property formRef!' }));
		}
		const projectQuery = {
			travellerName: { $concat: ['$firstName', ' ', '$lastName'] },
			travellerEmail: '$traveller.email',
			plannedDate: '$plannedDate',
			endDate: '$endDate',
			plannedTraveller: '$plannedTraveller',
		};
		if (type === 'admin') {
			projectQuery.specialistName = '$specialist.name';
			projectQuery.specialistNumber = '$specialist.phoneNumber';
			projectQuery.specialistPhoneCode = '$specialist.phoneCode';
			projectQuery.specialistImage = '$specialist.image';
		}
		const [details] = await ItineraryRequestModel.aggregate([
			{
				$match: { _id: Types.ObjectId(formRef) },
			},
			{
				$lookup: {
					from: 'itineraries',
					let: {
						formRef: '$_id',
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$formRef', '$$formRef'] },
									],
								},
							},
						},
						{
							$project: {
								itineraryDetails: {
									_id: '$_id',
									name: '$name',
									email: '$itineraryEmail',
									itineraryType: '$itineraryType',
									specialistNote: '$specialistNote',
									specificRestrictionsAndRegulations: '$specificRestrictionsAndRegulations',
									fromDate: '$fromDate',
									toDate: '$toDate',
									plannedTraveller: '$plannedTraveller',
									price: '$price',
									image: '$image',
									duration: '$duration',
									itineraryStatus: {
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
															{ $lt: [date, '$toDate'] },
															{ $gt: [date, '$fromDate'] },
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
															{ $gt: [date, '$toDate'] },
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
															{ $gt: [date, '$fromDate'] },
														],
													},
													then: ITINERARY_STATUS.CANCELLED,
												},
											],
											default: '$itineraryStatus',
										},

									},
									guests: '$guests',
									location: '$location.location',
									rooms: '$rooms',
									isPassport: '$isPassport',
									isDrivingLicense: '$isDrivingLicense',
									paymentStatus: '$paymentStatus',
								},
							},
						},
					],
					as: 'itinerary',
				},
			},
			{
				$unwind: { path: '$itinerary', preserveNullAndEmptyArrays: true },
			},
			{
				$lookup: {
					from: 'travellers',
					let: { travellerRef: '$travellerRef' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$_id', '$$travellerRef'] },
									],
								},
							},
						},
					],
					as: 'traveller',
				},
			},
			{
				$unwind: { path: '$traveller', preserveNullAndEmptyArrays: true },
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
					from: 'channeltousers',
					let: { userRef: '$travellerRef', channelRef: '$itinerary._id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$userRef', '$$userRef'] },
										{ $eq: ['$channelRef', '$$channelRef'] },
									],
								},
							},
						},
					],
					as: 'channel',
				},
			},
			{
				$unwind: { path: '$channel', preserveNullAndEmptyArrays: true },
			},
			{
				$project: {
					details: { $cond: [{ $not: '$itinerary.itineraryDetails' }, false, true] },
					channelRef: { $ifNull: ['$channel.channelRef', ''] },
					itineraryDetails:
					{
						$cond: [{ $not: '$itinerary.itineraryDetails.location' },
							{
								itineraryStatus: { $ifNull: ['$itinerary.itineraryDetails.itineraryStatus', '$status'] },
								location: '$location',
								name: { $ifNull: ['$itinerary.itineraryDetails.name', '$location'] },
								email: { $ifNull: ['$itinerary.itineraryDetails.email', '$traveller.email'] },
								itineraryType: { $ifNull: ['$itinerary.itineraryDetails.itineraryType', ITINERARY_DEFAULT_VALUES] },
								fromDate: { $ifNull: ['$itinerary.itineraryDetails.fromDate', '$plannedDate'] },
								toDate: { $ifNull: ['$itinerary.itineraryDetails.fromDate', '$endDate'] },
								plannedTraveller: { $ifNull: ['$itinerary.itineraryDetails.plannedTraveller', '$plannedTraveller'] },
								price: { $ifNull: ['$itinerary.itineraryDetails.price', ITINERARY_DEFAULT_VALUES] },
								duration: { $ifNull: ['$itinerary.itineraryDetails.duration', ITINERARY_DEFAULT_VALUES] },
								guests: { $ifNull: ['$itinerary.itineraryDetails.guests', '$travellers'] },
								rooms: { $ifNull: ['$itinerary.itineraryDetails.rooms', ITINERARY_DEFAULT_VALUES] },
							}, '$itinerary.itineraryDetails'],
					},
					travellerDetails: projectQuery,
				},
			},
		]);
		if (!details) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid formRef!' }));
		}
		return resolve(ResponseUtility.SUCCESS({
			data: details,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
