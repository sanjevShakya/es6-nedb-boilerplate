import './env';
import './db';

import fs from 'fs';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import express from 'express';
import favicon from 'serve-favicon';
import bodyParser from 'body-parser';
import compression from 'compression';

import routes from './routes';
import json from './core/middlewares/json';
import logger, { logStream } from './core/utils/logger';
import * as errorHandler from './core/middlewares/errorHandler';
// import * as mqttClientMiddleware from './core/middlewares/mqttClient';
import { SENSORS, handleSerialSocketBridge } from './app/serialSocketBridge/bridge';
import * as serialMiddleware from './core/middlewares/serialBus';
import * as socketMiddleware from './core/middlewares/socket';
import * as serialhandler from './app/serial/serialhandler';
import { getAppServer } from './core/utils/socket';
import * as serialDataService from './app/serial/serialDataService';
const app = express();
// const mqttClient = new MqttHandler();

const APP_PORT =
  (process.env.NODE_ENV === 'test' ? process.env.TEST_APP_PORT : process.env.APP_PORT) || process.env.PORT || '3333';
const APP_HOST = process.env.APP_HOST || '0.0.0.0';

const pathToSwaggerUi = require('swagger-ui-dist').absolutePath();
let serial = null;

try {
  serial = serialhandler.connect();
} catch (err) {
  // pass.connect
}
app.set('port', APP_PORT);
app.set('host', APP_HOST);

app.locals.title = process.env.APP_NAME;
app.locals.version = process.env.APP_VERSION;

// This request handler must be the first middleware on the app
if (serial) {
  app.use(serialMiddleware.injectSerial(serial));
}
app.use(favicon(path.join(__dirname, '/../public', 'favicon.ico')));
app.use(express.static('public'));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('tiny', { stream: logStream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(errorHandler.bodyParser);
app.use(json);

// API Routes
app.use('/api', routes);

// Swagger UI
// Workaround for changing the default URL in swagger.json
// https://github.com/swagger-api/swagger-ui/issues/4624
const swaggerIndexContent = fs
  .readFileSync(`${pathToSwaggerUi}/index.html`)
  .toString()
  .replace('https://petstore.swagger.io/v2/swagger.json', '/api/swagger.json');

app.get('/api-docs/index.html', (req, res) => res.send(swaggerIndexContent));
app.get('/api-docs', (req, res) => res.redirect('/api-docs/index.html'));
app.use('/api-docs', express.static(pathToSwaggerUi));

// Error Middleware
app.use(errorHandler.genericErrorHandler);
app.use(errorHandler.methodNotAllowed);
const { server, io } = getAppServer(app);

app.use(socketMiddleware.injectSocketObject(io));

handleSerialSocketBridge(io, serial);

// TODO move this logic to some service layer
// const STATES = {
//   INIT: 1,
//   RECORD: 2,
//   PAUSE: 3,
// };

// let state = STATES.INIT;
// let subjectId = null;
// let gaitClassId = null;
// let serialToFileLogger = (f) => f;

// if (serial) {
//   io.sockets.on('connection', function (socket) {
//     socket.on('initState', function (data) {
//       logger.info(`initState`, data);
//       subjectId = data.subjectId;
//       io.sockets.emit('stateChange', { value: STATES.INIT, subjectId: subjectId });
//     });

//     socket.on('stateChange', function (data) {
//       state = +data.value;
//       if (!subjectId) {
//         subjectId = data.subjectId;
//       }

//       logger.info(`socket state change: ${state} for subject: ${subjectId}`);
//       switch (state) {
//         case STATES.INIT:
//           serial.port.write(`${STATES.INIT}:INIT\n`);
//           break;
//         case STATES.RECORD:
//           serial.port.write(`${STATES.RECORD}:RECORD\n`);
//           break;
//         case STATES.PAUSE:
//           serial.port.write(`${STATES.PAUSE}:PAUSE\n`);
//           break;
//       }
//       io.sockets.emit('stateChange', { value: state });
//     });

//     socket.on('gaitClassChange', function (data) {
//       gaitClassId = data.value;
//       subjectId = data.subjectId;
//       logger.info(`Gait class set to: ${gaitClassId}`);
//       io.sockets.emit('gaitClassChange', { value: gaitClassId });
//       io.sockets.emit('stateChange', { value: STATES.PAUSE });
//       serialToFileLogger = serialDataService.parseSaveAccelData(subjectId, gaitClassId);
//     });

//     // socket.emit('led', { value: brightness });
//     socket.emit('stateChange', { value: state });
//   });

//   serial.serialEventEmitter.on('RIGHT_SERIAL_INPUT', function (data) {
//     function parseData(data) {
//       const serialData = data.split(':');

//       if (serialData.length > 0) {
//         const action = serialData[0];
//         const payload = serialData[1];

//         return {
//           action,
//           payload,
//         };
//       }

//       return null;
//     }

//     const serialData = parseData(data);

//     if (serialData.action === '100') {
//       io.emit('serialData', { value: serialData.payload });
//       serialToFileLogger(serialData.payload + '\n');
//     }
//   });
// }

server.listen(app.get('port'), app.get('host'), () => {
  Object.keys(SENSORS).map((key) => serialDataService.makeDataFolderIfNotExist(SENSORS[key]));
  logger.info(`Server started at http://${app.get('host')}:${app.get('port')}/api`);
});

// Catch unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', err);
  // process.exit(1);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

export default app;
