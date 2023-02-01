/* eslint-disable import/named */
import {
	AuthenticationControllers,
	ReportControllers,
} from '../controllers';

const prefix = '/api/report/';

export default (app) => {
	app.post(`${prefix}add`, AuthenticationControllers.authenticateUser, ReportControllers.add);
};
