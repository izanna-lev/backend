/* eslint-disable import/named */

import { ItineraryRequestModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	add: (req, res) => ModelResolver(req, res, ItineraryRequestModel.Add),
};
