import { Schema } from 'mongoose';
import database from '../db';
import { TYPE_OF_MESSAGE } from '../constants';

const Message = new Schema({
	userRef: { type: Schema.Types.ObjectId, required: true, index: true },
	channelRef: { type: Schema.Types.ObjectId, required: true, index: true },
	message: String,
	messageType: { type: Number, default: TYPE_OF_MESSAGE.TEXT },
	deleted: { type: Boolean, default: false },
	deletedOn: Date,
	createdOn: Date,
	updatedOn: Date,
}, { toJSON: { virtuals: true } });

export default database.model('Message', Message);
