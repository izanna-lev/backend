/* eslint-disable import/named */

import { TripModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	list: (req, res) => ModelResolver(req, res, TripModel.List),
	dayList: (req, res) => ModelResolver(req, res, TripModel.DayList),
};
