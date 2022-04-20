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
import { interpreter } from './app/ml/predict';
const app = express();
// const mqttClient = new MqttHandler();

const APP_PORT =
  (process.env.NODE_ENV === 'test' ? process.env.TEST_APP_PORT : process.env.APP_PORT) || process.env.PORT || '3333';
const APP_HOST = process.env.APP_HOST || '0.0.0.0';

const pathToSwaggerUi = require('swagger-ui-dist').absolutePath();
const pathToModel = path.join(__dirname, '/app/ml');
// let serial = null;

async function initializeExpressApp() {
  const serialInterfaces = await serialhandler.connect();

  app.set('port', APP_PORT);
  app.set('host', APP_HOST);

  app.locals.title = process.env.APP_NAME;
  app.locals.version = process.env.APP_VERSION;

  // This request handler must be the first middleware on the app
  // app.use(mlMiddleware.injectML(ml));
  if (serialInterfaces) {
    app.use(serialMiddleware.injectSerial(serialInterfaces));
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
  const { server, io } = getAppServer(app);

  app.use(socketMiddleware.injectSocketObject(io));

  handleSerialSocketBridge(io, serialInterfaces);

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
  app.use('/ml-model', express.static(pathToModel));

  // Error Middleware
  app.use(errorHandler.genericErrorHandler);
  app.use(errorHandler.methodNotAllowed);

  server.listen(app.get('port'), app.get('host'), async () => {
    Object.keys(SENSORS).map((key) => serialDataService.makeDataFolderIfNotExist(SENSORS[key]));
    logger.info(`Server started at http://${app.get('host')}:${app.get('port')}/api`);
    const ml = await interpreter();

    app.set('ml', ml);
  });

  return app;
}

const expressApp = initializeExpressApp();

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

export default expressApp;
