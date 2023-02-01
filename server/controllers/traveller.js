/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable import/named */

import { TravellerModel } from '../model';
import { RowndResolver, ModelResolver } from './resolvers';

export default {
	signin: (req, res) => RowndResolver(req, res, TravellerModel.Signin),
	actions: (req, res) => ModelResolver(req, res, TravellerModel.Actions),
};
