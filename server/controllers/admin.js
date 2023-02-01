/* eslint-disable import/named */
/**
 * @description
 * This is the controller for the admin
 * @author Santgurlal Singh
 * @since 12 Jan, 2021
 */

import { AdminModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	signup: (req, res) => ModelResolver(req, res, AdminModel.Signup),
	login: (req, res) => ModelResolver(req, res, AdminModel.Login),
	dashboard: (req, res) => ModelResolver(req, res, AdminModel.Dashboard),
	userList: (req, res) => ModelResolver(req, res, AdminModel.UserList),
	specialistList: (req, res) => ModelResolver(req, res, AdminModel.SpecialistList),
	editUser: (req, res) => ModelResolver(req, res, AdminModel.EditUser),
	itinerariesList: (req, res) => ModelResolver(req, res, AdminModel.ItinerariesList),
	userDetails: (req, res) => ModelResolver(req, res, AdminModel.UserDetails),
	createSpecialist: (req, res) => ModelResolver(req, res, AdminModel.CreateSpecialist),
	editSpecialist: (req, res) => ModelResolver(req, res, AdminModel.EditSpecialist),
	deleteSpecialist: (req, res) => ModelResolver(req, res, AdminModel.DeleteSpecialist),
	accessSpecialistList: (req, res) => ModelResolver(req, res, AdminModel.AccessSpecialistList),
	specialistActions: (req, res) => ModelResolver(req, res, AdminModel.SpecialistActions),
	assignSpecialist: (req, res) => ModelResolver(req, res, AdminModel.AssignSpecialist),
};
