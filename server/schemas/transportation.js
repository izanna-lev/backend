/**
* This schema represents all the Transportations.
* @author Pavleen Kaur
* @since 02 August,2022
*/
import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Transportation = new Schema({
	itineraryRef: { type: Schema.Types.ObjectId, required: true, index: true },
	airline: String,
	flightClass: Number,
	trainClass: Number,
	day: Number,
	departDateTime: Date,
	arrivalDateTime: Date,
	depart: {
		location: { type: String },
		type: { type: String },
		coordinates: [Number, Number],
	},
	arrival: {
		location: { type: String },
		type: { type: String },
		coordinates: [Number, Number],
	},
	arrivalStation: String,
	specialistNote: String,
	description: String,
	transportationType: { type: Number, required: true },
	userCarDetails: Object,
	deleted: { type: Boolean, default: false },
}, { timestamps: true });

Transportation.index({ location: '2dsphere' });
applyMiddleware(Transportation);
export default database.model('Transportation', Transportation);
