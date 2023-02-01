/**
* This schema represents all the Tickets.
* @author Pavleen Kaur
* @since 21 August,2022
*/
import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Ticket = new Schema({
	transportationRef: { type: Schema.Types.ObjectId, required: true, index: true },
	image: String,
	name: String,
	deleted: { type: Boolean, default: false },
}, { timestamps: true });

applyMiddleware(Ticket);
export default database.model('Ticket', Ticket);
