import db from '../../db';

const TABLE_NAME = 'devices';

/**
 * Device model.
 */
class Device extends db.Model {
  /**
   * Get table name.
   */
  get tableName() {
    return TABLE_NAME;
  }

  /**
   * Table has timestamps.
   */
  get hasTimestamps() {
    return true;
  }
}

export default Device;
