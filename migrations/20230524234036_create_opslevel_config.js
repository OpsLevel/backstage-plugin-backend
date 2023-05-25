/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('opslevel_config', function (table) {
    table.increments('id').unsigned().primary();
    table.string('key').notNullable();
    table.string('value').nullable();
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('opslevel_config');
};
