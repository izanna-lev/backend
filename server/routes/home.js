/* eslint-disable import/named */

import {
	AuthenticationControllers,
	HomeControllers,
} from '../controllers';

const prefix = '/api/home/';

export default (app) => {
	app.post(`${prefix}list`, AuthenticationControllers.authenticateUser, HomeControllers.list);
	app.post(`${prefix}details`, AuthenticationControllers.authenticateUser, HomeControllers.details);
};
