import { resolvePackagePath } from '@backstage/backend-common';
import { Knex } from 'knex';

export async function applyDatabaseMigrations(knex: Knex): Promise<void> {
  const migrationsDir = resolvePackagePath(
    '@opslevel/backstage-maturity-backend',
    'migrations',
  );

  await knex.migrate.latest({
    directory: migrationsDir,
  });
}
