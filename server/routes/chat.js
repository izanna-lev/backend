/* eslint-disable import/named */

import {
	AuthenticationControllers,
	ChatControllers,
} from '../controllers';
import { MultipartService } from '../services';

const prefix = '/api/chat/';

export default (app) => {
	app.post(`${prefix}getChannel`, AuthenticationControllers.authenticateSpecialist, ChatControllers.getChannel);
	app.post(`${prefix}chatList`, AuthenticationControllers.authenticateSpecialist, ChatControllers.chatList);
	app.post(`${prefix}chatImage`, MultipartService, AuthenticationControllers.authenticateSpecialist, ChatControllers.chatImage);
	app.post(`${prefix}messageList`, AuthenticationControllers.authenticateSpecialist, ChatControllers.messageList);
	app.post(`${prefix}unread`, AuthenticationControllers.authenticateSpecialist, ChatControllers.unread);
};
