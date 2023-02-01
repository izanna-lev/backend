/* eslint-disable import/named */

import { SpecialistModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	login: (req, res) => ModelResolver(req, res, SpecialistModel.Login),
	details: (req, res) => ModelResolver(req, res, SpecialistModel.Details),
	update: (req, res) => ModelResolver(req, res, SpecialistModel.Update),
	dashboard: (req, res) => ModelResolver(req, res, SpecialistModel.Dashboard),
	cancelRequestList: (req, res) => ModelResolver(req, res, SpecialistModel.CancelRequestList),
	travellerList: (req, res) => ModelResolver(req, res, SpecialistModel.TravellerList),
	broadcast: (req, res) => ModelResolver(req, res, SpecialistModel.Broadcast),
};
