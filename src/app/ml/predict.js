import * as tf from '@tensorflow/tfjs';
// import modelJson from './model.json';

export async function interpreter() {
  const model = await tf.loadLayersModel('http://localhost:8848/ml-model/model.json');

  return (tensor) => model.predict(tensor);
}
