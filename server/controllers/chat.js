/* eslint-disable import/named */

import { ChatModel } from '../model';
import { ModelResolver } from './resolvers';

export default {
	getChannel: (req, res) => ModelResolver(req, res, ChatModel.GetChannel),
	chatList: (req, res) => ModelResolver(req, res, ChatModel.ChatList),
	messageList: (req, res) => ModelResolver(req, res, ChatModel.MessageList),
	chatImage: (req, res) => ModelResolver(req, res, ChatModel.ChatImage),
	unread: (req, res) => ModelResolver(req, res, ChatModel.Unread),
};
