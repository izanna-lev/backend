/* eslint-disable import/named */

import { ItineraryModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	add: (req, res) => ModelResolver(req, res, ItineraryModel.Add),
	edit: (req, res) => ModelResolver(req, res, ItineraryModel.Edit),
	list: (req, res) => ModelResolver(req, res, ItineraryModel.List),
	details: (req, res) => ModelResolver(req, res, ItineraryModel.Details),
	cancel: (req, res) => ModelResolver(req, res, ItineraryModel.Cancel),
	complete: (req, res) => ModelResolver(req, res, ItineraryModel.Complete),
	submit: (req, res) => ModelResolver(req, res, ItineraryModel.Submit),
	approve: (req, res) => ModelResolver(req, res, ItineraryModel.Approve),
	cancellationRequest: (req, res) => ModelResolver(req, res, ItineraryModel.CancellationRequest),
};
