import { IdentityService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { OpsLevelController } from './OpsLevelController';
import { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import { CronTime} from 'cron';
import { NextFunction, Request, Response } from 'express';

export interface RouterOptions {
  logger: Logger;
  controller: OpsLevelController;
  identity: IdentityService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, controller, identity } = options;

  const router = Router();
  router.use(express.json());

  const validatePermissions = (_identity: BackstageIdentityResponse | undefined) => {
    logger.info('Unimplemented access permission check');
  }

  router.get('/ping', async (_, response) => { response.json({ "status": "OpsLevel Backend Plugin is present" })});

  router.get('/auto_sync', async (request, response) => {
    validatePermissions(await identity.getIdentity({ request: request }));

    response.json(await controller.getAutoSyncConfiguration());
  });

  router.post('/auto_sync', async (request, response) => {
    validatePermissions(await identity.getIdentity({ request: request }));

    const { auto_sync_enabled, auto_sync_schedule } = request.body;
    if (auto_sync_schedule && typeof(auto_sync_enabled) === 'boolean' && typeof(auto_sync_schedule) === 'string') {
      // This is what Backstage uses internally:
      try { new CronTime(auto_sync_schedule) } catch (e) { throw new Error("Invalid cron expression"); }
      await controller.setAutoSyncConfiguration(request.body);
      return response.json({"status": "ok"});
    }
    throw new Error("Invalid request format");
  });

  router.post('/auto_sync/runs', async (request, response) => {
    validatePermissions(await identity.getIdentity({ request: request }));
    const b = request.body;
    if ('page_number' in b && 'page_size' in b &&
      (b.page_number === null || typeof(b.page_number) === 'number') &&
      (b.page_size === null || typeof(b.page_size) === 'number')) {
      return response.json(await controller.getAutoSyncExecutions(b.page_number, b.page_size));
    }
    throw new Error("Invalid request format");
  });

  router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).send({ "error": err.message });
  });

  return router;
}
