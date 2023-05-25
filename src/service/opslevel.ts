import { createRouter } from "./router";
import { Logger } from 'winston';
import { PluginDatabaseManager } from '@backstage/backend-common';
import { PluginTaskScheduler } from '@backstage/backend-tasks';
import { applyDatabaseMigrations } from "../database/migrations";


export type OpslevelEnvironment = {
  logger: Logger;
  database: PluginDatabaseManager;
  scheduler?: PluginTaskScheduler;
};


export class OpslevelBuilder {
  private readonly env: OpslevelEnvironment;

  static create(env: OpslevelEnvironment) {
    return new OpslevelBuilder(env);
  }

  private constructor(env: OpslevelEnvironment) {
    this.env = env;
  }

  async build() {
    const { database, logger, scheduler } = this.env;
    
    const dbClient = await database.getClient();

    logger.info(scheduler);

    if (!database.migrations?.skip) {
      logger.info('Performing OpsLevel database migration(s)...');
      await applyDatabaseMigrations(dbClient);
    }

    // const catalogDatabase = new DefaultCatalogDatabase({
    //   database: dbClient,
    //   logger,
    // });

    const router = await createRouter({ logger: logger });

    return router;
  }
}