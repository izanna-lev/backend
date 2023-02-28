/* eslint-disable no-empty-pattern */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-async-promise-executor */
/* eslint-disable import/named */
/* eslint-disable no-underscore-dangle */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import {
	ItineraryRequestModel, 
	// AdminModel,
} from '../../schemas';
import {
	ITINERARY_STATUS,
} from '../../constants';

/**
* @description service model function to handle the dashboard of admin panel.
* @author Abhinav Sharma
* @since 25 February, 2021
*/

export default ({
	id,
	// timezone,
}) => new Promise(async (resolve, reject) => {
	try {
		// console.time('test');
		// await AdminModel.findOneAndUpdate({ _id: id }, { $set: { zone: timezone } });
		const [data] = await ItineraryRequestModel.aggregate([
			{
				$lookup: {
					from: 'itineraries',
					let: { formRef: '$_id' },
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
					],
					as: 'itinerary',
				},
			},
			{
				$unwind: { path: '$itinerary', preserveNullAndEmptyArrays: true },
			},
			{
				$addFields: {
					updatedStatus: {
						$switch: {
							branches: [
								{
									/*  Case: When itinerary is UPCOMING & it lies between its fromDate
										and toDate then it will be ONGOING provided it should not have
										the cancellation request on it  */
									case: {
										$and: [
											{ $eq: [{ $not: '$itinerary.approved' }, false] },
											{ $eq: ['$itinerary.itineraryStatus', ITINERARY_STATUS.UPCOMING] },
											{ $lt: [new Date(), '$itinerary.toDate'] },
											{ $gt: [new Date(), '$itinerary.fromDate'] },
											{ $not: '$itinerary.cancellationRequest' },
										],
									},
									then: ITINERARY_STATUS.ONGOING,
								},
								{
									/*  Case: When itinerary is UPCOMING & has reached its fromDate
		                                & not approved by the traveller yet and it will be expired
		                                with an itineraryStatus CANCELLED */
									case: {
										$and: [
											{ $eq: ['$itinerary.itineraryStatus', ITINERARY_STATUS.UPCOMING] },
											{ $not: '$itinerary.approved' },
											{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$itinerary.fromDate'] },
										],
									},
									then: ITINERARY_STATUS.CANCELLED,
								},
								{
									/*  Case: When itinerary is PENDING & has reached its fromDate
		                                & not approved by the traveller yet and it will be expired
		                                with an itineraryStatus CANCELLED */
									case: {
										$and: [
											{ $eq: ['$itinerary.itineraryStatus', ITINERARY_STATUS.PENDING] },
											{ $not: '$itinerary.approved' },
											{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), { $ifNull: ['$itinerary.fromDate', '$plannedDate'] }] },
										],
									},
									then: ITINERARY_STATUS.CANCELLED,
								},
								{
									/*  Case: If requested and itinerary not created
									        & exceeds planned date */
									case: {
										$and: [
											{ $cond: [{ $eq: [{ $not: '$itinerary' }, true] }, true, false] },
											{ $eq: ['$status', ITINERARY_STATUS.PENDING] },
											{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$plannedDate'] },
										],
									},
									then: ITINERARY_STATUS.CANCELLED,
								},
								{
									/*  Case: When itinerary is ONGOING & has reached its toDate
		                                & it will be completed provided it does not have cancellation
										request on it with an itineraryStatus COMPLETED */
									case: {
										$and: [
											{ $eq: ['$itinerary.itineraryStatus', ITINERARY_STATUS.ONGOING] },
											{ $not: '$itinerary.cancellationRequest' },
											{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$itinerary.toDate'] },
										],
									},
									then: ITINERARY_STATUS.COMPLETED,
								},

							],
							default: { $ifNull: ['$itinerary.itineraryStatus', '$status'] },
						},
					},
				},
			},
			{
				$project: {
					approved: { $cond: [{ $eq: [{ $not: '$itinerary.approved' }, true] }, false, true] },
					itineraryStatus: '$itinerary.itineraryStatus',
					status: {
						$cond: [{
							$and: [
								{ $eq: ['$updatedStatus', ITINERARY_STATUS.CANCELLED] },
								{ $not: '$itinerary.approved' },
								{ $gt: [new Date(new Date().setHours(0, 0, 0, 0)), '$itinerary.fromDate'] },
							],
						}, ITINERARY_STATUS.EXPIRED, '$updatedStatus'],
					},
				},
			},
			{
				$group: {
					_id: null,
					pending: { $sum: { $cond: [{ $eq: ['$status', ITINERARY_STATUS.PENDING] }, 1, 0] } },
					approved: { $sum: { $cond: [{ $eq: ['$approved', true] }, 1, 0] } },
					completed: { $sum: { $cond: [{ $eq: ['$status', ITINERARY_STATUS.COMPLETED] }, 1, 0] } },
				},
			},
			{
				$unset: ['_id'],
			},
		]);
		// console.timeLog('test');
		return resolve(ResponseUtility.SUCCESS({
			data,
		}));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
