/* eslint-disable consistent-return */
import * as Rownd from '@rownd/node';
import { ROWND_APP_KEY, ROWND_APP_SECRET } from '../constants';
/**
 * @description service module used for creating an instance of ROWND.
 * @author Pavleen Kaur
 * @since 18 August, 2022
 */
const rownd = Rownd.createInstance({
	app_key: ROWND_APP_KEY,
	app_secret: ROWND_APP_SECRET,
});
const { authenticate } = rownd.express;

export default {
	rownd,
	authenticate,
};
