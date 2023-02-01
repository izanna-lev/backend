/* eslint-disable import/named */
import {
	AuthenticationControllers,
	TransactionControllers,
} from '../controllers';

const prefix = '/api/transaction/';

export default (app) => {
	app.post(`${prefix}list`, AuthenticationControllers.authenticateUser, TransactionControllers.list);
};
