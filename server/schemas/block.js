import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Block = new Schema({
	blockedBy: { type: Schema.Types.ObjectId, Required: true },
	blockedUser: { type: Schema.Types.ObjectId, Required: true },
	itineraryRef: { type: Schema.Types.ObjectId, Required: true, index: true },
	deleted: { type: Boolean, default: false },
}, { timestamps: true });

applyMiddleware(Block);
export default database.model('Block', Block);
