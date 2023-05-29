/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('opslevel_export_run', function (table) {
    table.increments('id').unsigned().primary();
    table.string('trigger').notNull();
    table.string('state').notNull();
    table.dateTime('started_at').notNull();
    table.dateTime('completed_at').nullable();
    table.text('output').nullable();
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('opslevel_export_run');
};
