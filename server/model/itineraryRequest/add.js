/* eslint-disable no-underscore-dangle */
/* eslint-disable import/named */
import {
	ResponseUtility, PropsValidationUtility,
} from 'appknit-backend-bundle';
import { Types } from 'mongoose';
import {
	ItineraryRequestModel, ItineraryModel, AdminModel, ChannelToUserModel,
} from '../../schemas';

/**
* @description service model function to handle the creation of itinerary.
* @author Haswanth Reddy
* @param {String} id the unique _id of the traveller.
* @param {String} firstName the first name of the itinerary.
* @param {String} lastName the last name of the itinerary.
* @param {String} contactNumber the contact number of the itinerary.
* @param {String} phoneCode the phoneCode of contact number for the itinerary.
* @param {Number} travellers the number of travellers.
* @param {Number} plannedTraveller the planning of the traveller for the itinerary.
* @param {Number} plannedDate the planned date for travel for the itinerary.
* @param {Object} location as per traveller request form.
*/

export default ({
	id,
	firstName,
	lastName,
	contactNumber,
	phoneCode,
	travellers,
	plannedDate,
	endDate,
	plannedTraveller,
	location,
}) => new Promise(async (resolve, reject) => {
	try {
		const { code, message } = await PropsValidationUtility({
			validProps: ['firstName', 'lastName', 'contactNumber', 'phoneCode', 'travellers',
				'plannedDate', 'endDate', 'plannedTraveller', 'location',
			],
			sourceDocument: {
				firstName,
				lastName,
				contactNumber,
				phoneCode,
				travellers,
				plannedDate,
				endDate,
				plannedTraveller,
				location,
			},
		});

		if (code !== 100) {
			return reject(ResponseUtility.MISSING_PROPS({ message }));
		}

		if (new Date(plannedDate) <= new Date()) {
			return resolve(ResponseUtility.GENERIC_ERR({ message: 'Invalid Date' }));
		}
		const itineraryRequest = new ItineraryRequestModel({
			travellerRef: Types.ObjectId(id),
			firstName,
			lastName,
			contactNumber,
			phoneCode,
			travellers,
			plannedDate: new Date(plannedDate),
			endDate: new Date(endDate),
			plannedTraveller,
			location,
		});

		await itineraryRequest.save();
		const admin = await AdminModel.findOne({});
		const createItinerary = new ItineraryModel({
			formRef: itineraryRequest._id,
			travellerRef: id,
			adminRef: admin._id,
		});
		await createItinerary.save();
		const createChannelToTraveller = new ChannelToUserModel({
			userRef: id,
			channelRef: createItinerary._id,
			lastMessageReadAt: Date.now(),
			createdOn: Date.now(),
			updatedOn: Date.now(),
		});
		const createChannelToAdmin = new ChannelToUserModel({
			userRef: admin._id,
			channelRef: createItinerary._id,
			lastMessageReadAt: Date.now(),
			createdOn: Date.now(),
			updatedOn: Date.now(),
		});
		const promises = [];
		promises.push(createChannelToAdmin.save());
		promises.push(createChannelToTraveller.save());
		await Promise.all(promises);
		return resolve(ResponseUtility.SUCCESS({ data: itineraryRequest }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
