/* eslint-disable no-undef */
/* eslint-disable import/named */

import {
	AuthenticationControllers,
	SpecialistControllers,
	NotificationControllers,
} from '../controllers';
import { MultipartService } from '../services';

const prefix = '/api/specialist/';

export default (app) => {
	app.post(`${prefix}login`, SpecialistControllers.login);
	app.post(`${prefix}dashboard`, AuthenticationControllers.authenticateSpecialist, SpecialistControllers.dashboard);
	app.post(`${prefix}travellerList`, AuthenticationControllers.authenticateSpecialist, SpecialistControllers.travellerList);
	app.post(`${prefix}details`, AuthenticationControllers.authenticateSpecialist, SpecialistControllers.details);
	app.post(`${prefix}update`, MultipartService, AuthenticationControllers.authenticateSpecialist, SpecialistControllers.update);
	app.post(`${prefix}cancelRequestList`, AuthenticationControllers.authenticateSpecialist, SpecialistControllers.cancelRequestList);
	app.post(`${prefix}broadcast`, AuthenticationControllers.authenticateSpecialist, SpecialistControllers.broadcast);
	app.post(`${prefix}template`, AuthenticationControllers.authenticateSpecialist, NotificationControllers.template);
};
