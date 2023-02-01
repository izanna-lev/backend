/* eslint-disable max-len */
/* eslint-disable import/named */
import {
	AuthenticationControllers,
	CardControllers,
} from '../controllers';

const prefix = '/api/card/';

export default (app) => {
	app.post(`${prefix}add`, AuthenticationControllers.authenticateUser, CardControllers.add);
	app.post(`${prefix}list`, AuthenticationControllers.authenticateUser, CardControllers.list);
	app.post(`${prefix}remove`, AuthenticationControllers.authenticateUser, CardControllers.remove);
};
