import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Report = new Schema({
	reportedBy: { type: Schema.Types.ObjectId, Required: true },
	reportedUser: { type: Schema.Types.ObjectId, Required: true },
	reason: { type: String, required: true },
	deleted: { type: Boolean, default: false },
}, { timestamps: true });

applyMiddleware(Report);
export default database.model('Report', Report);
