import * as tf from '@tensorflow/tfjs';
// import modelJson from './model.json';
require('dotenv');

export const modelNames = {
  CNN: 'cnn',
  CNN_STAT: 'cnnStat',
  CNN_LSTM: 'cnnLSTM',
};

export const mlModelMap = {
  [modelNames.CNN]: {
    name: 'CNN network',
    path: 'ml-model/tensorjs-cnn-best/model.json',
    tensorShape: [1, 128, 12, 1],
    reshape: false,
    multiInput: false,
    computeStatisticalFeatures: false,
  },
  [modelNames.CNN_STAT]: {
    name: 'CNN Statistic network',
    statTensorShape: [1, 12],
    path: 'ml-model/tensorjs-cnn-stat-best/model.json',
    tensorShape: [1, 128, 12, 1],
    reshape: false,
    multiInput: true,
    computeStatisticalFeatures: true,
  },
  [modelNames.CNN_LSTM]: {
    name: 'CNN LSTM variant',
    path: 'ml-model/tensorjs-cnn-lstm-best/model.json',
    tensorShape: [1, 4, 32, 12, 1],
    reshape: true,
    multiInput: false,
    computeStatisticalFeatures: false,
  },
};

export async function interpreter() {
  const modelName = process.env.MODEL;
  const modelConfig = mlModelMap[modelName];

  const model = await tf.loadLayersModel(`http://localhost:8848/${modelConfig.path}`);

  return (tensor) => model.predict(tensor);
}
