/* eslint-disable no-undef */
/* eslint-disable import/named */
import { MultipartService } from '../services';
import {
	AuthenticationControllers,
	ReservationControllers,
} from '../controllers';


const prefix = '/api/reservation/';

export default (app) => {
	app.post(`${prefix}addAccommodation`, MultipartService, AuthenticationControllers.authenticateSpecialist, ReservationControllers.addAccommodation);
	app.post(`${prefix}editAccommodation`, MultipartService, AuthenticationControllers.authenticateSpecialist, ReservationControllers.editAccommodation);
	app.post(`${prefix}addRestaurant`, MultipartService, AuthenticationControllers.authenticateSpecialist, ReservationControllers.addRestaurant);
	app.post(`${prefix}editRestaurant`, MultipartService, AuthenticationControllers.authenticateSpecialist, ReservationControllers.editRestaurant);
	app.post(`${prefix}addActivity`, MultipartService, AuthenticationControllers.authenticateSpecialist, ReservationControllers.addActivity);
	app.post(`${prefix}editActivity`, MultipartService, AuthenticationControllers.authenticateSpecialist, ReservationControllers.editActivity);
	app.post(`${prefix}delete`, AuthenticationControllers.authenticateSpecialist, ReservationControllers.delete);
	app.post(`${prefix}list`, AuthenticationControllers.authenticateSpecialist, ReservationControllers.list);
};
