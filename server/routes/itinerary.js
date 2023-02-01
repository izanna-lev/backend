/* eslint-disable import/named */

import { MultipartService } from '../services';
import {
	AuthenticationControllers,
	ItineraryControllers,
} from '../controllers';

const prefix = '/api/itinerary/';

export default (app) => {
	app.post(`${prefix}add`, MultipartService, AuthenticationControllers.authenticateSpecialist, ItineraryControllers.add);
	app.post(`${prefix}edit`, MultipartService, AuthenticationControllers.authenticateSpecialist, ItineraryControllers.edit);
	app.post(`${prefix}list`, AuthenticationControllers.authenticateSpecialist, ItineraryControllers.list);
	app.post(`${prefix}details`, AuthenticationControllers.authenticateSpecialist, ItineraryControllers.details);
	app.post(`${prefix}cancel`, AuthenticationControllers.authenticateSpecialist, ItineraryControllers.cancel);
	app.post(`${prefix}complete`, AuthenticationControllers.authenticateSpecialist, ItineraryControllers.complete);
	app.post(`${prefix}submit`, AuthenticationControllers.authenticateSpecialist, ItineraryControllers.submit);
	app.post(`${prefix}approve`, AuthenticationControllers.authenticateUser, ItineraryControllers.approve);
	app.post(`${prefix}cancellationRequest`, AuthenticationControllers.authenticateUser, ItineraryControllers.cancellationRequest);
};
