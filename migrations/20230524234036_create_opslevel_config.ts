import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('opslevel_config', function (table) {
    table.string('key').primary();
    table.string('value').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('opslevel_config');
}
