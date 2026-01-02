import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('opslevel_export_run', function (table) {
    table.increments('id').unsigned().primary();
    table.string('trigger').notNull();
    table.string('state').notNull();
    table.dateTime('started_at').notNull();
    table.dateTime('completed_at').nullable();
    table.text('output').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('opslevel_export_run');
}
