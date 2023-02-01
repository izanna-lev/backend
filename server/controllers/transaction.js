/* eslint-disable import/named */

import { TransactionModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	list: (req, res) => ModelResolver(req, res, TransactionModel.List),
};
