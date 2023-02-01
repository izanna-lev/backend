/**
* This schema represents all the Transportations.
* @author Pavleen Kaur
* @since 02 August,2022
*/
import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Traveller = new Schema({
	rowndId: String,
	name: String,
	email: String,
	image: String,
	device: String,
	fcmToken: String,
	deleted: { type: Boolean, default: false },
	blocked: { type: Boolean, default: false },
	stripeCustomerId: String,
}, { timestamps: true });

applyMiddleware(Traveller);
export default database.model('Traveller', Traveller);
