/* eslint-disable import/named */
import {
	AuthenticationControllers,
	RatingControllers,
} from '../controllers';

const prefix = '/api/rating/';

export default (app) => {
	app.post(`${prefix}add`, AuthenticationControllers.authenticateUser, RatingControllers.add);
};
