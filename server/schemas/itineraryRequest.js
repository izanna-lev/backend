import { Schema } from 'mongoose';
import { ITINERARY_STATUS } from '../constants';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const ItineraryRequest = new Schema({
	travellerRef: { type: Schema.Types.ObjectId,index: true ,unique: true, sparse: true },
	specialistRef: { type: Schema.Types.ObjectId,index: true },
	firstName: { type: String, required: true, index: true },
	lastName: { type: String, required: true, index: true },
	contactNumber: { type: String, required: true },
	phoneCode: { type: String, required: true },
	location: { type: String, required: true },
	travellers: { type: Number, required: true },
	plannedDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	plannedTraveller: { type: Number, required: true },
	status: { type: Number, required: true, default: ITINERARY_STATUS.PENDING },
}, { timestamps: true });

ItineraryRequest.index({ travellerRef: 1, specialistRef: 1 }, { unique: true });
applyMiddleware(ItineraryRequest);
export default database.model('ItineraryRequest', ItineraryRequest);
