import path from 'path';
import nedb from 'nedb-promises';

import { USER_TABLE, GAIT_RECORD_TABLE, SUBJECT_TABLE } from './tableNames';

const db = {};

const SCHEMA = {
  [USER_TABLE]: {
    filename: path.join('data/users.db'),
  },
  [GAIT_RECORD_TABLE]: { filename: path.join('data/gait_records.db') },
  [SUBJECT_TABLE]: { filename: path.join('data/subjects.db') },
};

for (const schemaKey in SCHEMA) {
  db[schemaKey] = new nedb({
    autoload: true,
    filename: SCHEMA[schemaKey].filename,
  });
}

export default db;
