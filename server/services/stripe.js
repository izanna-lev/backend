/* eslint-disable import/named */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable consistent-return */
/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-promise-executor-return */
/**
 * @desc The module containing the stripe related functionality
 * to handle the stripe payments
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */
import Stripe from 'stripe';
import { ResponseUtility } from 'appknit-backend-bundle';
import { STRIPE_SECRET_KEY } from '../constants';

const stripe = new Stripe(STRIPE_SECRET_KEY);
/**
  * create a unique stripe user. Will check from database
  * regarding the existence and will be called if key has not
  * been generated already for an existing user.
  * This will create the new user with credit card details.
  * Usually, this will be created for the student account
  * @param {String} email
  * @param {String} id
  * @param {String} card, to be provided for student profile
  * @param {String} bank, to be provided for teacher profile
  * either user email or id is required
  * either card or bank token of the user is required.
  */
const CreateUser = ({
	email,
	id,
	card,
}) => new Promise(async (resolve, reject) => {
	stripe.customers.create({
		email: email || id,
		description: `Stripe details for ${email || id} customer`,
		source: card,
	}).then((success) => {
		const object = { altered: success, raw: success };
		resolve(object);
	}).catch((err) => reject(err));
});

/**
  * remove the requested card from the list
  *@see https://stripe.com/docs/api#delete_card
  * @param {*} param0
  */
const RemoveCard = ({ customerId, cardId }) => new Promise((resolve, reject) => {
	// global.logger.info(customerId, cardId);
	if (customerId && cardId) {
		stripe.customers.deleteCard(customerId, cardId)
			.then((success) => {
				resolve(success);
			}).catch((err) => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});
/**
  * delete an external stripe account
  * This is invoked when a suer requests ot remove a linked banked
  * account with the external account.
  * @param {*} param0
  */
const RemoveExternalAccount = ({ accountId, bankId }) => new Promise((resolve, reject) => {
	if (accountId) {
		stripe.accounts.deleteExternalAccount(accountId, bankId)
			.then((success) => resolve(success))
			.catch((err) => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
  * accept the new bank account details and replace it with the new ones
  * @param {*} param0
  */
const UpdateExternalAccount = ({ accountId, bankId }) => new Promise(async (resolve, reject) => {
	try {
		if (accountId && bankId) {
			const updateAccount = await stripe.accounts.updateExternalAccount(
				accountId,
				bankId,
				{ default_for_currency: true },
			);
			return resolve(updateAccount);
		}
		return reject('Missing Properties accountId or bankId');
	} catch (err) {
		return reject(err);
	}
});

/**
  * Create a new bank user
  */
const CreateBankUser = ({
	email,
	token,	// the bank account id
	personalDetails: {
		address: {
			city,
			country,
			line1,
			postal,
			state,
		},
		dob: {
			day,
			month,
			year,
		},
		firstName,
		lastName,
		type,
		ip,
	},
	verificationDocumentData,
}) => new Promise(async (resolve, reject) => {
	if (email && token) {
		/**
		 * create a user with bank account
		 * process with sripe connect API
		 * 1. create a new account with stripe connect API
		 * 2. Add a bank account via token,
		 */
		const account = await stripe.account.create({ type: 'custom', country: 'AU', email });
		if (account) {
			const { id } = account;
			const updatedAccount = await stripe.accounts.update(id, {
				external_account: token,
				tos_acceptance: {
					date: Math.floor(Date.now() / 1000),
					ip,
				},
				legal_entity: {
					address: {
						city,
						country,
						line1,
						postal_code: postal,
						state,
					},
					first_name: firstName,
					last_name: lastName,
					type,
					dob: {
						day,
						month,
						year,
					},
				},
			});
			global.logger.info(updatedAccount);
			if (updatedAccount) {
				// upload the verrificaiton document here.
				const upload = await stripe.fileUploads.create(
					{
						purpose: 'identity_document',
						file: {
							data: verificationDocumentData,
							name: '',
							type: 'application/octect-stream',
						},
					},
					{ stripe_account: id },
				);

				/**
				  * @todo parse the returned token and attach it with the
				  * stripe account
				  */
				const attach = await stripe.accounts.update(id, {
					legal_entity: {
						verification: {
							document: upload.id,
						},
					},
				});
				global.logger.info(attach);
				// added an partner account with bank account.
				const response = { altered: { id: updatedAccount.id, default_source: updatedAccount.external_accounts.data[0].id }, raw: updatedAccount };
				resolve(response);
			} else {
				reject(ResponseUtility.GENERIC_ERR({ message: 'Erro adding external account to the created partner account ' }));
			}
		}
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
  * create a new payment for the provided source. Handle respective errror
  * @param {Number} amount
  * @param {String} currency
  * @param {String} source the id of the card
  * @param {String} description
  */
const CreatePayment = ({
	amount,
	currency = 'USD',
	source,
	customer,
	description,
}) => new Promise((resolve, reject) => {
	if (amount && currency && source) {
		stripe.charges.create({
			amount,
			currency,
			source,
			customer,
			description,
		})
			.then((success) => resolve(success))
			.catch((err) => reject(err));
	} else {
		reject(ResponseUtility.MISSING_PROPS());
	}
});

/**
  * handle the payout to the teachers account
  * @param amount
  * @param description
  * @param destination The ID of a bank account or a card to send the payout to.
  * If no destination is supplied, the default external account for the specified
  * currency will be used.
  * @param sourceType The source balance to draw this payout from. Balances for
  * different payment sources are kept separately. You can find the amounts with
  * the balances API. Valid options are: alipay_account, bank_account, and card.
  * @see https://stripe.com/docs/api/node#create_payout for more
  * @return Promise
  */
const HandlePayout = ({
	amount,
	description,
	destination,
	sourceType,
}) => new Promise(async (resolve, reject) => {
	/**
	  * @todo handle payouts implementation
	  */
	try {
		if (amount && description && destination) {
			const payout = await stripe.payouts.create({
				amount,
				currency: 'usd',
			}, { stripeAccount: destination });

			return resolve(payout);
		}
	} catch (err) {
		return reject(err);
	}
});

/**
  * handles the amount transfer from the stripe dashboard to a particular connect id.
  * @see https://stripe.com/docs/api/transfers
  * @param {Number} amount The amount to be transfered to the connect id which will be used for payout.
  * @param {String} destination The account id on which the transfer of the amount is to be made.
  */

const HandleTransfer = ({
	amount,
	destination,
}) => new Promise(async (resolve, reject) => {
	try {
		if (amount && destination) {
			const transfer = await stripe.transfers.create({
				amount,
				destination,
				currency: 'usd',
				transfer_group: 'ACCOUNT_TRANSFERS',
			});

			return resolve(transfer);
		}
	} catch (err) {
		return reject(err);
	}
});

/**
  * cerate a customer account to handle payouts
  * @see https://stripe.com/docs/api/node#create_account
  * @param {String} email
  */
const CreateCustomAccount = ({ email, country }) => new Promise((resolve, reject) => {
	stripe.accounts.create({
		type: 'custom',
		country,
		email,
	}).then((account) => {
		resolve(account);
	}).catch((err) => reject(err));
});

/**
  * add externa account to a stripe connect account.
  * use the stripe account update function to add external account
  */
const AddExternalAccount = ({ userStripeId, token }) => new Promise(async (resolve, reject) => {
	try {
		if (userStripeId && token) {
			const account = await stripe.accounts.createExternalAccount(
				userStripeId,
				{
					external_account: token,
				},
			);
			return resolve(account);
		}
	} catch (err) {
		reject(err);
	}
});

/**
  * process the refeund based on the incurred charge
  * @param {String} chargeId the id of the charge to process refund.
  * @param {Number} amount if defined, the amount of money will be refunded, By deducting some charges
  */
const ProcessRefund = ({ chargeId, amount }) => new Promise(async (resolve, reject) => {
	if (!chargeId && !amount) {
		return reject(ResponseUtility.MISSING_REQUIRES_PROPS);
	}
	// global.logger.info('here');
	if (amount) {
		try {
			const chargeResponse = await stripe.refunds.create({
				charge: chargeId,
				amount,
			});
			return resolve(chargeResponse);
		} catch (err) {
			return reject(err);
		}
	}

	try {
		const response = await stripe.refunds.create({
			charge: chargeId,
		});
		resolve(response);
	} catch (err) {
		// global.logger.error(err);
		reject(err);
	}
});

const CreateSource = ({ customer, source }) => new Promise(async (resolve, reject) => {
	if (!customer && !source) {
		return reject(ResponseUtility.MISSING_REQUIRES_PROPS);
	}
	try {
		const response = await stripe.customers.createSource(customer, { source });
		resolve(response);
	} catch (err) {
		reject(err);
	}
});

const DeleteSource = ({ customer, source }) => new Promise(async (resolve, reject) => {
	if (!customer && !source) {
		return reject(ResponseUtility.MISSING_REQUIRES_PROPS);
	}
	try {
		const response = await stripe.customers.deleteSource(customer, source);
		resolve(response);
	} catch (err) {
		reject(err);
	}
});

/**
  * Create a new connect user
  */
const CreateConnectUser = ({
	email,
	token,
	StripeId,
	verificationDocumentDataBack,
	verificationDocumentDataFront,
	city,
	country,
	line1,
	line2,
	postal_code,
	type,
	business_type,
	state,
	first_name,
	last_name,
	day,
	month,
	year,
	gender,
	phone,
	ssn_last_4,
	ip,
	url,
	mcc,
}) => new Promise(async (resolve, reject) => {
	try {
		if ((email || StripeId) && token) {
			let accountData;
			if (email) {
				const account = await stripe.account.create({
					type,
					country,
					email,
					business_type,
					requested_capabilities: ['card_payments', 'transfers'],
				});
				const uploadFront = await stripe.files.create(
					{
						purpose: 'identity_document',
						file: {
							data: verificationDocumentDataFront,
							name: 'identity_document_front',
							type: 'application/octect-stream',
						},
					},
					{ stripe_account: account.id },
				);
				const uploadBack = await stripe.files.create(
					{
						purpose: 'identity_document',
						file: {
							data: verificationDocumentDataBack,
							name: 'identity_document_back',
							type: 'application/octect-stream',
						},
					},
					{ stripe_account: account.id },
				);
				accountData = await stripe.accounts.update(
					account.id,
					{
						external_account: token,
						tos_acceptance: {
							date: Math.floor(Date.now() / 1000),
							ip,
						},
						business_profile: {
							url,
							mcc,
						},
						individual: {
							address: {
								city,
								country,
								line1,
								line2,
								postal_code,
								state,
							},
							first_name,
							last_name,
							dob: {
								day,
								month,
								year,
							},
							gender,
							phone,
							email,
							ssn_last_4,
							verification: {
								document: {
									back: uploadFront.id,
									front: uploadBack.id,
								},
							},
						},
					},
				);
			} else {
				accountData = await stripe.accounts.update(
					StripeId,
					{
						external_account: token,
						individual: {
							address: {
								city,
								country,
								line1,
								line2,
								postal_code,
								state,
							},
							dob: {
								day,
								month,
								year,
							},
							gender,
							phone,
							email,
						},
					},
				);
			}
			resolve(accountData);
		} else {
			reject(ResponseUtility.MISSING_PROPS());
		}
	} catch (err) {
		reject(err);
	}
});

const UpdateDefaultSource = ({ customer, defaultSource }) => new Promise(async (resolve, reject) => {
	if (!customer && !defaultSource) {
		return reject(ResponseUtility.MISSING_REQUIRES_PROPS);
	}
	try {
		const response = await stripe.customers.update(customer, { default_source: defaultSource });
		resolve(response);
	} catch (err) {
		reject(err);
	}
});

const DeleteConnectAccount = ({ stripeConnectId }) => new Promise(async (resolve, reject) => {
	if (!stripeConnectId) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Required property missing.' }));
	}
	try {
		const response = await stripe.accounts.del(stripeConnectId);
		resolve(response);
	} catch (err) {
		reject(err);
	}
});

const RetrieveConnectAccount = ({ stripeConnectId }) => new Promise(async (resolve, reject) => {
	if (!stripeConnectId) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Required property missing.' }));
	}
	try {
		const response = await stripe.accounts.retrieve(stripeConnectId);
		resolve(response);
	} catch (err) {
		reject(err);
	}
});
const CreateCardToken = ({
	cardNumber, year, month, cvv,
}) => new Promise(async (resolve, reject) => {
	if (!(cardNumber && year && month && cvv)) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Required property missing.' }));
	}
	try {
		const response = stripe.tokens.create(
			{
				card: {
					number: cardNumber,
					exp_month: month,
					exp_year: year,
					cvc: cvv,
				},
			},
		);
		return resolve(response);
	} catch (err) {
		return reject(err);
	}
});

/**
 * To create a suscription
 * @param customerId
 * @param planId
 * @see https://stripe.com/docs/api/subscriptions for more
 * @return Promise
 */
const CreateSubscription = ({
	customerId,
	planId,
	coupon,
}) => new Promise(async (resolve, reject) => {
	if (!(customerId && planId)) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Required property missing.' }));
	}
	try {
		const response = stripe.subscriptions.create({
			customer: customerId,
			items: [
				{
					plan: planId,
				},
			],
			coupon,
		});
		return resolve(response);
	} catch (err) {
		return reject(err);
	}
});

/**
 * To list suscriptions of customer
 * @param customerId
 * @see https://stripe.com/docs/api/subscriptions for more
 * @return Promise
 */
const ListSubscriptions = ({
	customerId,
}) => new Promise(async (resolve, reject) => {
	if (!customerId) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Required property missing.' }));
	}
	try {
		const response = stripe.subscriptions.list(
			{ customer: customerId },
		);
		return resolve(response);
	} catch (err) {
		return reject(err);
	}
});

/**
 * To get details of a subscription
 * @param subscriptionId
 * @see https://stripe.com/docs/api/subscriptions for more
 * @return Promise
 */
const SubscriptionDetails = ({
	subscriptionId,
}) => new Promise(async (resolve, reject) => {
	if (!subscriptionId) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Required property missing.' }));
	}
	try {
		const response = stripe.subscriptions.retrieve(subscriptionId);
		return resolve(response);
	} catch (err) {
		return reject(err);
	}
});

/**
 * To cancel a subscription
 * @param subscriptionId
 * @see https://stripe.com/docs/api/subscriptions for more
 * @return Promise
 */
const CancelSubscription = ({
	subscriptionId,
}) => new Promise(async (resolve, reject) => {
	if (!subscriptionId) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Required property missing.' }));
	}
	try {
		const response = stripe.subscriptions.update(
			subscriptionId,
			{ cancel_at_period_end: true },
		);
		return resolve(response);
	} catch (err) {
		return reject(err);
	}
});

/**
 * To list transactions
 * @param customerId
 * @see https://stripe.com/docs/api/charges for more
 * @return Promise
 */
const ListTransactions = ({
	customerId,
}) => new Promise(async (resolve, reject) => {
	if (!customerId) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Required property missing.' }));
	}
	try {
		const response = stripe.charges.list(
			{ customer: customerId, limit: 100 },
		);
		return resolve(response);
	} catch (err) {
		return reject(err);
	}
});

/**
 * To get details of a coupon
 * @param coupon the unique coupon code
 * @see https://stripe.com/docs/api/coupon for more
 * @return Promise
 */
const CouponDetails = (coupon) => new Promise(async (resolve, reject) => {
	if (!coupon) {
		return reject(ResponseUtility.GENERIC_ERR({ message: 'Required property missing.' }));
	}
	try {
		const response = stripe.coupons.retrieve(coupon);
		return resolve(response);
	} catch (err) {
		return reject(err);
	}
});

const fees = {
	USD: { Percent: 2.9, Fixed: 0.30 },
	GBP: { Percent: 2.4, Fixed: 0.20 },
	EUR: { Percent: 2.4, Fixed: 0.24 },
	CAD: { Percent: 2.9, Fixed: 0.30 },
	AUD: { Percent: 2.9, Fixed: 0.30 },
	NOK: { Percent: 2.9, Fixed: 2 },
	DKK: { Percent: 2.9, Fixed: 1.8 },
	SEK: { Percent: 2.9, Fixed: 1.8 },
	JPY: { Percent: 3.6, Fixed: 0 },
	MXN: { Percent: 3.6, Fixed: 3 },
};

const calculateStripeServiceCharges = ({ amount, currency }) => {
	const charges = fees[currency];
	const calculatedAmount = parseFloat(amount);
	const fee = ((calculatedAmount * charges.Percent) / 100) + charges.Fixed;
	const net = parseFloat(calculatedAmount) + parseFloat(fee);
	return {
		amount,
		fee: parseFloat(parseFloat(fee).toFixed(2)),
		net: parseFloat(parseFloat(net).toFixed(2)),
	};
};

const VerifyToken = ({
	token,
}) => new Promise(async (resolve, reject) => {
	try {
		const tokenVerified = await stripe.tokens.retrieve(token);
		return resolve(tokenVerified);
	} catch (err) {
		return reject(token);
	}
});

export default {
	stripe,
	CreateUser,
	CreatePayment,
	HandlePayout,
	HandleTransfer,
	CreateCustomAccount,
	AddExternalAccount,
	CreateBankUser,
	ProcessRefund,
	RemoveCard,
	RemoveExternalAccount,
	UpdateExternalAccount,
	CreateSource,
	DeleteSource,
	CreateConnectUser,
	UpdateDefaultSource,
	calculateStripeServiceCharges,
	DeleteConnectAccount,
	RetrieveConnectAccount,
	CreateCardToken,
	CreateSubscription,
	CancelSubscription,
	SubscriptionDetails,
	ListTransactions,
	CouponDetails,
	VerifyToken,
};
