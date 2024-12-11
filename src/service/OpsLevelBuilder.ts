import { createRouter } from "./router";
import { applyDatabaseMigrations } from "../database/migrations";
import { OpsLevelDatabase } from "../database/OpsLevelDatabase";
import { OpsLevelController } from "./OpsLevelController";
import { CatalogClient } from "@backstage/catalog-client";
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';

export const opsLevelBackstageMaturityBackendPlugin = createBackendPlugin({
  pluginId: 'backstage-maturity-backend',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        scheduler: coreServices.scheduler,
        database: coreServices.database,
        discovery: coreServices.discovery,
        rootHttpRouter: coreServices.rootHttpRouter,
      },
      async init({ 
        config,
        logger, 
        discovery, rootHttpRouter, database,scheduler 
      }) {
        const catalog = new CatalogClient({ discoveryApi: discovery });
        logger.debug('Catalog client created');
    
        const dbClient = await database.getClient();
        logger.debug('DB client created');

        if (!database.migrations?.skip) {
          logger.info('Performing database migration(s)');
          await applyDatabaseMigrations(dbClient);
        }
        logger.debug('DB migration check finished');

        const opsLevelDatabase = new OpsLevelDatabase(dbClient, logger);
        logger.debug('DB created');
        const opsLevelController = new OpsLevelController(opsLevelDatabase, logger, scheduler, catalog, config);

        opsLevelController.scheduleAutoSyncIfApplicable();
        logger.debug('Auto-sync task scheduling completed');

        const router = await createRouter({ controller: opsLevelController});

        logger.debug('Created router');

        rootHttpRouter.use('/api/opslevel', router);
        logger.debug('Registered router');
      },
    });
  },
});