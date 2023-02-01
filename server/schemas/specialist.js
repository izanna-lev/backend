/**
* This schema represents all the Specialists.
* @author Pavleen Kaur
* @since 12 August,2022
*/
import { Schema } from 'mongoose';
import { HashUtility } from 'appknit-backend-bundle';
import database from '../db';
import { applyMiddleware } from './commonSchemaMiddleware';

const Specialist = new Schema({
	name: String,
	email: String,
	password: String,
	phoneCode: String,
	phoneNumber: String,
	blocked: { type: Boolean, default: false },
	deleted: { type: Boolean, default: false },
	image: String,
	access: {},
	fcmToken: { type: String, default: '' },
	device: { type: String, default: '' },
	zone: String,
}, { timestamps: true });

applyMiddleware(Specialist);
applyMiddleware(Specialist, async function (next) {
	const data = this;
	if (data.password) {
		data.password = await HashUtility.generate({ text: data.password });
	}
	next();
});
export default database.model('Specialist', Specialist);
