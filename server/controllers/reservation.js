/* eslint-disable import/named */

import { ReservationModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	addAccommodation: (req, res) => ModelResolver(req, res, ReservationModel.AddAccommodation),
	editAccommodation: (req, res) => ModelResolver(req, res, ReservationModel.EditAccommodation),
	addRestaurant: (req, res) => ModelResolver(req, res, ReservationModel.AddRestaurant),
	editRestaurant: (req, res) => ModelResolver(req, res, ReservationModel.EditRestaurant),
	addActivity: (req, res) => ModelResolver(req, res, ReservationModel.AddActivity),
	editActivity: (req, res) => ModelResolver(req, res, ReservationModel.EditActivity),
	delete: (req, res) => ModelResolver(req, res, ReservationModel.Delete),
	list: (req, res) => ModelResolver(req, res, ReservationModel.List),
};
