import { Schema } from 'mongoose';
import database from '../db';

const ChannelToUser = new Schema({
	userRef: { type: Schema.Types.ObjectId, required: true },
	channelRef: { type: Schema.Types.ObjectId, required: true },
	lastMessageReadAt: { type: Date, required: true },
	createdOn: Date,
	updatedOn: Date,
});

ChannelToUser.index({ userRef: 1, channelRef: 1 }, { unique: true });
export default database.model('ChannelToUser', ChannelToUser);
