/* eslint-disable import/named */

import { TransportationModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	addFlight: (req, res) => ModelResolver(req, res, TransportationModel.AddFlight),
	editFlight: (req, res) => ModelResolver(req, res, TransportationModel.EditFlight),
	addTrainFerry: (req, res) => ModelResolver(req, res, TransportationModel.AddTrainFerry),
	editTrainFerry: (req, res) => ModelResolver(req, res, TransportationModel.EditTrainFerry),
	addCar: (req, res) => ModelResolver(req, res, TransportationModel.AddCar),
	editCar: (req, res) => ModelResolver(req, res, TransportationModel.EditCar),
	upload: (req, res) => ModelResolver(req, res, TransportationModel.Upload),
	delete: (req, res) => ModelResolver(req, res, TransportationModel.Delete),
	list: (req, res) => ModelResolver(req, res, TransportationModel.List),
};
