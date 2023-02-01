import { Schema } from 'mongoose';
import database from '../db';

const Card = new Schema({
	userRef: { type: Schema.Types.ObjectId, required: true },
	stripeToken: String,
	lastDigitsOfCard: { type: Number, required: true },
	cardType: { type: String, required: true },
	stripeId: { type: String, required: true },
	stripeCustomerId: { type: String, required: true },
	country: { type: String, required: true },
	deleted: { type: Boolean, default: false },
	defaultCard: { type: Boolean, default: true },
}, { timestamps: true });

export default database.model('Card', Card);
