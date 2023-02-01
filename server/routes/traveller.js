/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
/* eslint-disable import/named */
import {
	AuthenticationControllers,
	TravellerControllers,
	ChatControllers,
} from '../controllers';
import { RowndService, MultipartService } from '../services';

const prefix = '/api/traveller/';
export default (app) => {
	app.post(`${prefix}signin`, RowndService.authenticate(), TravellerControllers.signin);
	app.post(`${prefix}actions`, AuthenticationControllers.authenticateUser, TravellerControllers.actions);
	app.post(`${prefix}chatList`, AuthenticationControllers.authenticateUser, ChatControllers.chatList);
	app.post(`${prefix}getChannel`, AuthenticationControllers.authenticateUser, ChatControllers.getChannel);
	app.post(`${prefix}messageList`, AuthenticationControllers.authenticateUser, ChatControllers.messageList);
	app.post(`${prefix}chatImage`, MultipartService, AuthenticationControllers.authenticateUser, ChatControllers.chatImage);
	app.post(`${prefix}unread`, AuthenticationControllers.authenticateUser, ChatControllers.unread);
};
