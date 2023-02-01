/* eslint-disable import/named */

import { HomeModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	list: (req, res) => ModelResolver(req, res, HomeModel.List),
	details: (req, res) => ModelResolver(req, res, HomeModel.Details),
};
