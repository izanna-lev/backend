/* eslint-disable import/named */

import { NoteModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	add: (req, res) => ModelResolver(req, res, NoteModel.Add),
	edit: (req, res) => ModelResolver(req, res, NoteModel.Edit),
	delete: (req, res) => ModelResolver(req, res, NoteModel.Delete),
	list: (req, res) => ModelResolver(req, res, NoteModel.List),
};
