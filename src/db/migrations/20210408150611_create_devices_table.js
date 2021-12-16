/**
 * Create table `devices`.
 *
 * @param   {object} knex
 * @returns {Promise}
 */
export function up(knex) {
  return knex.schema.createTable('devices', (table) => {
    table.increments();
    table.timestamp('created_at').notNull().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at').notNull().defaultTo(knex.raw('now()'));
    table.string('name').unique().notNull();
    table.string('macId').unique().notNull();
    table.boolean('isVerified').defaultTo(false);
    table.decimal('tolerableSleepDuration').defaultTo(10);
    table.decimal('minVibrationAmplitude').defaultTo(0);
    table.decimal('maxVibrationAmplitude').defaultTo(10);
    table.string('metadataId').unique().notNull();
  });
}

/**
 * Drop `devices`.
 *
 * @param   {object} knex
 * @returns {Promise}
 */
export function down(knex) {
  return knex.schema.dropTable('devices');
}
