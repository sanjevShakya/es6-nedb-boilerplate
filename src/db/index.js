import path from 'path';
import nedb from 'nedb-promises';

import { USER_TABLE } from './tableNames';

const db = {};

const SCHEMA = {
  [USER_TABLE]: {
    filename: path.join('data/users.db')
  }
};

for (const schemaKey in SCHEMA) {
  db[schemaKey] = new nedb({
    autoload: true,
    filename: SCHEMA[schemaKey].filename
  });
}

export default db;
