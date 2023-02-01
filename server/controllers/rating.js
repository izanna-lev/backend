/* eslint-disable import/named */

import { RatingModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	add: (req, res) => ModelResolver(req, res, RatingModel.Add),
};
