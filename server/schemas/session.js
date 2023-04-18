import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Session = new Schema({
	sessionId: String,
	userRef: { type: Schema.Types.ObjectId, Required: true },
}, { timestamps: true });

applyMiddleware(Session);
export default database.model('Session', Session);
