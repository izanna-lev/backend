/**
* This schema represents the Itinerary.
* @author Pavleen Kaur
* @since 23 July,2022
*/
import { Schema } from 'mongoose';
import { ITINERARY_STATUS, PAYMENT_STATUS } from '../constants';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Itinerary = new Schema({
	name: String,
	itineraryEmail: String,
	travellerRef: { type: Schema.Types.ObjectId },
	specialistRef: { type: Schema.Types.ObjectId },
	adminRef: { type: Schema.Types.ObjectId },
	formRef: { type: Schema.Types.ObjectId },
	itineraryType: Number,
	specialistNote: String,
	specificRestrictionsAndRegulations: String,
	fromDate: Date,
	toDate: Date,
	plannedTraveller: Number,
	price: Number,
	image: String,
	location: {
		location: { type: String },
		type: { type: String },
		coordinates: [Number, Number],
	},
	rating: {},
	duration: Number,
	itineraryStatus: { type: Number, default: ITINERARY_STATUS.PENDING },
	approved: Date,
	cancellationRequest: Date,
	guests: Number,
	rooms: Number,
	paymentStatus: { type: Number, default: PAYMENT_STATUS.UNPAID },
	isPassport: { type: Boolean, default: false },
	isDrivingLicense: { type: Boolean, default: false },
}, { timestamps: true });

Itinerary.index({ specialistRef: 1, travelerRef: 1, formRef: 1, adminRef: 1 }, { unique: true });
Itinerary.index({ location: '2dsphere' });
applyMiddleware(Itinerary);
export default database.model('Itinerary', Itinerary);
