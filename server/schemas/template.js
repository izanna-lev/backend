import { Schema } from 'mongoose';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Template = new Schema({
	title: { type: String, Required: true },
}, { timestamps: true });

applyMiddleware(Template);
export default database.model('Template', Template);
