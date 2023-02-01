/**
* This is the {{app_name}} constant file
* @author {{app_author}}
* @since {{app_date}}
*/

export const {
	HOST = 'http://localhost:3000/api/',
	WEB_HOST,
	S3_BUCKET = '',
	// atlas configurations
	ATLAS_USER,
	ATLAS_PASSWORD,
	ATLAS_CLUSTER,
	SECRET_STRING,
	PAGINATION_LIMIT = 30,
	// RabbitMQ configuration
	RABBITMQ_HOST,
	RABBITMQ_USER,
	RABBITMQ_PASSWORD,
	RABBITMQ_HEARTBEAT,
	REDIS_HOST,
	REDIS_PORT,
	REDIS_PASSWORD,
	APP_NAME = 'APP_NAME',
	APP_LOGO_URL = 'https://app-onsite.s3.amazonaws.com/development/images/best/1663737395523-269',
	NODE_ENV = `${APP_NAME}-development`,
	ROWND_APP_KEY,
	ROWND_APP_SECRET,
	APP_ID,
	BUSINESS_EMAIL,
	CONTACT_US_EMAIL,
	STRIPE_SECRET_KEY_TEST,
	STRIPE_SECRET_KEY_LIVE,
	PRIVATE_KEY,
	CERT,
} = process.env;

const db = process.env.MONGO_DB || '{{app_name}}';

export const STRIPE_SECRET_KEY = (NODE_ENV !== 'production') ? STRIPE_SECRET_KEY_TEST : STRIPE_SECRET_KEY_LIVE;

/**
 * @description
 * This is the sample constact specifier for queues
 * The queue names follow follow the "camelcase" naming
 * convention wehere the first letter of the queue will
 * be capital case. The queue channels are defined under server/queues/
 * directory and will be autoloded by directory indexer unless explicitly
 * ignored in skip array in index.js. The sampleQueue.js is a sample
 * channel that is meant to be updated/renamed as per the queue requirements.
 * To know more about the channel convention and design principles
 * @contact sharma02gaurav@gmail.com
 */
export const AMQP_QUEUES = {
	SAMPLE_QUEUE: 'SampleQueue',
};

// export const mongoConnectionString = `mongodb://${host}:${port}/${db}`;
export const mongoConnectionString = `mongodb+srv://${ATLAS_USER}:${ATLAS_PASSWORD}@${ATLAS_CLUSTER}/${db}?retryWrites=true`;

// this string is unique for each project construction
export const secretString = SECRET_STRING;

export const SUCCESS_CODE = 100;

export const MB = 1024 * 1024;

export const GENDER = {
	MALE: 1,
	FEMALE: 2,
	OTHERS: 3,
};

export const S3_IMAGES = {
	SMALL: `${S3_BUCKET}/${NODE_ENV}/images/small`,
	AVERAGE: `${S3_BUCKET}/${NODE_ENV}/images/average`,
	BEST: `${S3_BUCKET}/${NODE_ENV}/images/best`,
	GLOBAL: `${S3_BUCKET}/globalImages`,
};

export const SOCIAL_IDENTIFIER = {
	FB: 1,
	APPLE: 2,
	GOOGLE: 3,
};

export const VERIFICATION_TYPE = {
	CHANGE_PASSWORD: 1,
	EMAIL_VERIFICATION: 2,
};

export const TOKEN_EXPIRATION_TIME = 604800000;

export const ADMIN_USER_ACTIONS = {
	VERIFIED: 1,
	BLOCKED: 2,
	UNBLOCKED: 3,
	DELETED: 4,
};

export const TYPE_OF_NOTIFICATIONS = {
	ADMIN: 1,
	MESSAGE: 2,
	CANCEL_REQUEST: 3,
	ITINERARY_EDITED: 4,
	ASSIGN_SPECIALIST: 5,
	ITINERARY_SUBMITTED: 6,
	SPECIALIST: 7,
};

export const USER_TYPE = {
	TRAVELLER: 1,
	SPECIALIST: 2,
	ADMIN: 3,
};

/**
* @desc for App - Side for ITINERARY_STATUS
* upcoming - when itinerary assigned to a specialist till itinerary starts ***
* ongoing - approved current date in the travel date range
* completed - approved and current date is more than toDate
* cancelled - when cancel request and the cancel request is approved by admin
*/

/**
* @desc for Web-App/Admin-Side ITINERARY_STATUS
* pending - when itinerary assigned to a specialist till itinerary is submitted.
* upcoming - when itinerary submitted to a specialist till itinerary approved or cancelled.
* completed - approved and current date is more than toDate
* cancelled - when cancel request and the cancel request is approved by admin or specialist
if specialist has the required permissions.
*/
export const ITINERARY_STATUS = {
	ONGOING: 1,
	UPCOMING: 2,
	CANCELLED: 3,
	PENDING: 4,
	COMPLETED: 5,
	EXPIRED: 6,
};

export const PLANNED_TRVELLER = {
	HAVENT_STARTED: 1,
	FEW_THINGS: 2,
	IMPORTANT_STUFF: 3,
};

export const ITINERARY_TYPE = {
	ONE_DAY_TRIP: 1,
	DOMESTIC_TRIP: 2,
	INTERNATIONAL_TRIP: 3,
};

export const RESERVATION_TYPE = {
	ACCOMMODATION: 1,
	RESTAURANT: 2,
	ACTIVITY: 3,
};

export const TRANSPORTATION_TYPE = {
	FLIGHT: 1,
	TRAIN: 2,
	FERRY: 3,
	CAR: 4,
};

export const PAYMENT_STATUS = {
	UNPAID: 1,
	PAID: 2,
};

export const FLIGHT_CLASS = {
	BUSINESS: 1,
	ECONOMY: 2,
	FIRST_CLASS: 3,
};
export const TRAIN_CLASS = {
	STANDARD: 1,
	BUSINESS: 2,
};

export const DEFAULT_DAY = 1;

export const HOME_LIST_TYPE = {
	CURRENT: 1,
	PENDING: 2,
	PAST: 3,
};

export const SPECIALIST_ACTION = {
	ACTIVATE: 1,
	DEACTIVATE: 2,
};

export const USER_FILTER = {
	TRAVELLER: 1,
	SPECIALIST: 2,
	ALL: 3,
};

export const CANCELLATION_CHARGE = 9.99;

export const USER_ACTIONS = {
	BLOCK: 1,
	UNBLOCK: 2,
};

export const TRANSACTION_TYPE = {
	PAID: 1,
	CANCELLATION_CHARGES: 2,
};


export const DETAIL_TYPE = {
	ACCOMMODATION: 1,
	RESTAURANT: 2,
	ACTIVITY: 3,
	FLIGHT: 4,
	TRAIN: 5,
	FERRY: 6,
	CAR: 7,
	NOTE: 8,
	CHECK_OUT: 9,
};

export const TYPE_OF_MESSAGE = {
	TEXT: 1,
	IMAGE: 2,
	LINK: 3,
};

export const DATE_TYPE = {
	ARRIVAL: 1,
	DEPART: 2,
};

export const HOUR = 60;
export const MILLISECOND_EQUIVALENT = 1000 * 60 * 60;
export const ITINERARY_DEFAULT_VALUES = 0;

export const NOTIFICATION_TEMPLATES = {
	'A specialist has been assigned on your itinerary': 1,
	'Accommodation details updated on your itinerary': 2,
	'Train details updated on your itinerary': 3,
	'Restaurant booking confirmed on your itinerary': 4,
	'Activity details updated on your itinerary': 5,
	'Itinerary has been completed. You can rate your experience': 6,
};

export const LATEST_LIMIT = 15;
