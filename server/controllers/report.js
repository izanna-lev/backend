/* eslint-disable import/named */

import { ReportModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	add: (req, res) => ModelResolver(req, res, ReportModel.Add),
};
