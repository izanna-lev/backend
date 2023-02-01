/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable import/named */

import {
	AuthenticationControllers,
	TransportationControllers,
} from '../controllers';
import { MultipartService } from '../services';

const prefix = '/api/transportation/';

export default (app) => {
	app.post(`${prefix}addFlight`, AuthenticationControllers.authenticateSpecialist, TransportationControllers.addFlight);
	app.post(`${prefix}editFlight`, AuthenticationControllers.authenticateSpecialist, TransportationControllers.editFlight);
	app.post(`${prefix}addTrainFerry`, AuthenticationControllers.authenticateSpecialist, TransportationControllers.addTrainFerry);
	app.post(`${prefix}editTrainferry`, AuthenticationControllers.authenticateSpecialist, TransportationControllers.editTrainFerry);
	app.post(`${prefix}addCar`, AuthenticationControllers.authenticateSpecialist, TransportationControllers.addCar);
	app.post(`${prefix}editCar`, AuthenticationControllers.authenticateSpecialist, TransportationControllers.editCar);
	app.post(`${prefix}upload`, MultipartService, AuthenticationControllers.authenticateSpecialist, TransportationControllers.upload);
	app.post(`${prefix}delete`, AuthenticationControllers.authenticateSpecialist, TransportationControllers.delete);
	app.post(`${prefix}list`, AuthenticationControllers.authenticateSpecialist, TransportationControllers.list);
};
