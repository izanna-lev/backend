/**
* This schema represents all the Reservations.
* @author Pavleen Kaur
* @since 02 August,2022
*/
import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Reservation = new Schema({
	name: String,
	day: Number,
	itineraryRef: { type: Schema.Types.ObjectId, required: true, index: true },
	reservationType: Number,
	image: String,
	contactNumber: String,
	phoneCode: String,
	description: String,
	location: {
		location: { type: String },
		type: { type: String },
		coordinates: [Number, Number],
	},
	checkInDateTime: Date,
	checkOutDateTime: Date,
	reservationDateTime: Date,
	deleted: { type: Boolean, default: false },
}, { timestamps: true });

Reservation.index({ location: '2dsphere' });
applyMiddleware(Reservation);
export default database.model('Reservation', Reservation);
