/* eslint-disable import/named */

import { NotificationControllers, AuthenticationControllers } from '../controllers';

/**
 * @author Abhinav Sharma
 * @since 10 March 2021
 */

const prefix = '/api/notification/';

export default (app) => {
	app.post(`${prefix}travellerList`, AuthenticationControllers.authenticateUser, NotificationControllers.travellerList);
	app.post(`${prefix}specialistList`, AuthenticationControllers.authenticateSpecialist, NotificationControllers.specialistList);
	app.post(`${prefix}broadcast`, AuthenticationControllers.authenticateAdmin, NotificationControllers.broadcast);
	app.post(`${prefix}userSelectList`, AuthenticationControllers.authenticateAdmin, NotificationControllers.userSelectList);
	app.post(`${prefix}seen`, AuthenticationControllers.authenticateUser, NotificationControllers.seen);
	app.post(`${prefix}template`, AuthenticationControllers.authenticateAdmin, NotificationControllers.template);
};
