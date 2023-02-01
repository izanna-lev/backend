/**
* This schema represents the Itinerary.
* @author Pavleen Kaur
* @since 23 July,2022
*/
import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Note = new Schema({
	itineraryRef: { type: Schema.Types.ObjectId, required: true },
	day: { type: Number, required: true },
	image: { type: String, required: true },
	description: { type: String, required: true },
	deleted: { type: Boolean, default: false },
}, { timestamps: true });

applyMiddleware(Note);
export default database.model('Note', Note);
