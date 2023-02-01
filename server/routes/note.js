/* eslint-disable import/named */

import { MultipartService } from '../services';
import {
	AuthenticationControllers,
	NoteControllers,
} from '../controllers';

const prefix = '/api/note/';

export default (app) => {
	app.post(`${prefix}add`, MultipartService, AuthenticationControllers.authenticateSpecialist, NoteControllers.add);
	app.post(`${prefix}edit`, MultipartService, AuthenticationControllers.authenticateSpecialist, NoteControllers.edit);
	app.post(`${prefix}delete`, AuthenticationControllers.authenticateSpecialist, NoteControllers.delete);
	app.post(`${prefix}list`, AuthenticationControllers.authenticateSpecialist, NoteControllers.list);
};
