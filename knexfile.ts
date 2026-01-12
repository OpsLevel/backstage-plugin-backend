import type { Knex } from 'knex';

// This file makes it possible to run "yarn knex migrate:make some_file_name"
// to assist in making new migrations
const config: Knex.Config = {
  client: 'better-sqlite3',
  connection: ':memory:',
  useNullAsDefault: true,
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
};

export default config;
