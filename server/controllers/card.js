/* eslint-disable import/named */
import { CardModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	add: (req, res) => ModelResolver(req, res, CardModel.Add),
	list: (req, res) => ModelResolver(req, res, CardModel.List),
	remove: (req, res) => ModelResolver(req, res, CardModel.Remove),
};
