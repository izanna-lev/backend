/* eslint-disable import/named */

import {
	AuthenticationControllers,
	TripControllers,
} from '../controllers';

const prefix = '/api/trip/';

export default (app) => {
	app.post(`${prefix}list`, AuthenticationControllers.authenticateSpecialist, TripControllers.list);
	app.post(`${prefix}dayList`, AuthenticationControllers.authenticateSpecialist, TripControllers.dayList);
};
