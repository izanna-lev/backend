/* eslint-disable no-param-reassign */
/* eslint-disable import/named */
/**
* This is the server file for {{app_name}}
* @author {{app_author}}
* @since {{app_date}}
*/
import express from 'express';
import busboyBodyParser from 'busboy-body-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import morgan from 'morgan';
import path from 'path';
import flash from 'connect-flash';
import passport from 'passport';
import cors from 'cors';
import redis from 'socket.io-redis';
import {
	LogServices, TokenUtility,
} from 'appknit-backend-bundle';
import ActivateRoutes from './routes';
import { startSocket } from './services/socket';
import {
	secretString,
	REDIS_HOST,
	REDIS_PORT,
	REDIS_PASSWORD,
} from './constants';

const app = express();
const { logger } = LogServices;
global.logger = logger;
// enable cors support
app.use(cors({
	origin: '*',
	methods: ['GET', 'POST'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-HTTP-Method-Override', 'Accept'],
	credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(busboyBodyParser());
app.use(LogServices.RequestInterceptor);

app.use(morgan('dev'));
app.use(express.static(path.resolve('dist')));
app.use(session({ secret: secretString, resave: true, saveUninitialized: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(flash());

// call this to activate routes or define inside the route directory
ActivateRoutes(app);

const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

app.get('/', (req, res) => res.send(`<h1>{{app_name}} ${env} environment</h1>`));

const port = 3000;

const server = app.listen(port, () => global.logger.info(`Backend is running on port ${port}`));

const io = require('socket.io')(server, {
	transports: ['websocket'],
	serveClient: true,
});

io.adapter(redis({ host: REDIS_HOST, port: REDIS_PORT, auth_pass: REDIS_PASSWORD }));

io.use((socket, next) => {
	if (socket.handshake.auth || socket.handshake.query.authorization
				|| socket.handshake.headers.authorization) {
		const decoded = TokenUtility.decodeToken(socket.handshake.auth.token
						|| socket.handshake.headers.authorization);
		if (decoded) {
			return next();
		}
		return next(new Error('authentication error'));
	}
	return next(new Error('authentication error'));
});

io.on('connection', startSocket);

global.io = io;
