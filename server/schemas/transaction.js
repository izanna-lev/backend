/**
* This schema represents the Transaction schema
* @author Haswanth Reddy
*/
import { Schema } from 'mongoose';
import database from '../db';

const Transaction = new Schema({
	itineraryRef: { type: Schema.Types.ObjectId, Required: true, index: true },
	cancelled: { type: Boolean },
	stripeChargeId: { type: String, Required: true },
	stripeChargeResponse: { type: Object, Required: true },
	transactionId: { type: String, Required: true },
	paymentMethod: { type: String, Required: true },
	receiptUrl: { type: String, Required: true },
	price: { type: Object, Required: true },
	amount: { type: Number, Required: false },
	transactionType: Number,
	description: String,
	priceDetails: Object,
	createdOn: Date,
	updatedOn: Date,
});

export default database.model('Transaction', Transaction);
