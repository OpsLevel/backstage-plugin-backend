import { createRouter } from "./router";
import { Logger } from 'winston';
import { PluginDatabaseManager, PluginEndpointDiscovery } from '@backstage/backend-common';
import { PluginTaskScheduler } from '@backstage/backend-tasks';
import { applyDatabaseMigrations } from "../database/migrations";
import { OpsLevelDatabase } from "../database/OpsLevelDatabase";
import { OpsLevelController } from "./OpsLevelController";
import { CatalogClient } from "@backstage/catalog-client";
import { IdentityApi } from '@backstage/plugin-auth-node';
import { Config } from "@backstage/config";


export type OpsLevelEnvironment = {
  logger: Logger;
  database: PluginDatabaseManager;
  scheduler: PluginTaskScheduler;
  discovery: PluginEndpointDiscovery;
  identity: IdentityApi;
  config: Config;
};


export class OpsLevelBuilder {
  private readonly env: OpsLevelEnvironment;
  private opsLevelDatabase: OpsLevelDatabase | null;
  private opsLevelController: OpsLevelController | null;

  static create(env: OpsLevelEnvironment) {
    return new OpsLevelBuilder(env);
  }

  private constructor(env: OpsLevelEnvironment) {
    this.env = env;
    this.opsLevelDatabase = null;
    this.opsLevelController = null;
  }

  async build() {
    const { database, logger, scheduler, identity, discovery, config } = this.env;
    const catalog = new CatalogClient({ discoveryApi: discovery });
    
    const dbClient = await database.getClient();

    logger.info(scheduler);

    if (!database.migrations?.skip) {
      logger.info('Performing database migration(s)');
      await applyDatabaseMigrations(dbClient);
    }

    this.opsLevelDatabase = new OpsLevelDatabase(dbClient, logger);
    this.opsLevelController = new OpsLevelController(this.opsLevelDatabase, logger, scheduler, catalog, config);

    this.opsLevelController.scheduleAutoSyncIfApplicable();

    const router = await createRouter({ logger: logger, controller: this.opsLevelController, identity: identity });

    return router;
  }
}
