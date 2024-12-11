import express from 'express';
import Router from 'express-promise-router';
import { OpsLevelController } from './OpsLevelController';
import { CronTime} from 'cron';
import { NextFunction, Request, Response } from 'express';

export interface RouterOptions {
  controller: OpsLevelController;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { controller} = options;

  const router = Router();
  router.use(express.json());

  router.get('/ping', async (_, response) => { response.json({ "status": "OpsLevel Backend Plugin is present" })});

  router.get('/auto_sync', async (_, response) => {

    response.json(await controller.getAutoSyncConfiguration());
  });

  router.post('/auto_sync', async (request, response) => {

    const { auto_sync_enabled, auto_sync_schedule } = request.body;
    if (auto_sync_schedule && typeof(auto_sync_enabled) === 'boolean' && typeof(auto_sync_schedule) === 'string') {
      // This is what Backstage uses internally:
      try { new CronTime(auto_sync_schedule) } catch (e) { throw new Error("Invalid cron expression"); }
      if (!auto_sync_schedule.startsWith("0 ")) throw new Error("Can run at most once per hour")
      await controller.setAutoSyncConfiguration(request.body);
      return response.json({"status": "ok"});
    }
    throw new Error("Invalid request format");
  });

  router.post('/auto_sync/runs', async (request, response) => {
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
