/* eslint-disable no-promise-executor-return */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/named */
import {
	ResponseUtility,
} from 'appknit-backend-bundle';
import {
	TravellerModel,
} from '../../schemas';
import { ADMIN_USER_ACTIONS } from '../../constants';
import { RowndService } from '../../services';

/**
* @description service model function to handle edition of user.
* @author Abhinav Sharma
* @since 10 March 2021
*/

export default ({
	userRef,
	action,
}) => new Promise(async (resolve, reject) => {
	try {
		if (!(userRef && action)) {
			return reject(ResponseUtility.MISSING_PROPS({ message: `Missing Property ${userRef ? 'action' : 'userRef'}` }));
		}
		if (!Object.keys(ADMIN_USER_ACTIONS)[action - 1]) {
			return reject(ResponseUtility.GENERIC_ERR({ message: 'Invalid action provided!' }));
		}

		const user = await TravellerModel.findOneAndUpdate(
			{ _id: userRef },
			action === ADMIN_USER_ACTIONS.DELETED ? { deleted: true }
				: (
					action === ADMIN_USER_ACTIONS.BLOCKED ? { blocked: true }
						: (
							action === ADMIN_USER_ACTIONS.UNBLOCKED
								? { blocked: false } : { verified: true }
						)
				),
		);
		if (action === ADMIN_USER_ACTIONS.DELETED) {
			await RowndService.rownd.deleteUser(user.rowndId);
		}

		return resolve(ResponseUtility.SUCCESS({ message: `User has been successfully ${Object.keys(ADMIN_USER_ACTIONS)[action - 1].toLowerCase()}` }));
	} catch (err) {
		return reject(ResponseUtility.GENERIC_ERR({ message: err.message, error: err }));
	}
});
