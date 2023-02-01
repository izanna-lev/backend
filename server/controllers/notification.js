/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable import/named */
/*
* This is the controller for Notifications
* @author Abhinav Sharma
* @since 10 March, 2021
*/
import { NotificationModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	specialistList: (req, res) => ModelResolver(req, res, NotificationModel.NotificationSpecialistListService),
	broadcast: (req, res) => ModelResolver(req, res, NotificationModel.NotificationBroadcastService),
	userSelectList: (req, res) => ModelResolver(req, res, NotificationModel.NotificationUserSelectListService),
	travellerList: (req, res) => ModelResolver(req, res, NotificationModel.NotificationTravellerListService),
	seen: (req, res) => ModelResolver(req, res, NotificationModel.NotificationSeenService),
	template: (req, res) => ModelResolver(req, res, NotificationModel.NotificationTemplateService),
};
