/* eslint-disable import/named */
import {
	AuthenticationControllers,
	ItineraryRequestControllers,
} from '../controllers';

const prefix = '/api/itineraryRequest/';

export default (app) => {
	app.post(`${prefix}add`, AuthenticationControllers.authenticateUser, ItineraryRequestControllers.add);
};
