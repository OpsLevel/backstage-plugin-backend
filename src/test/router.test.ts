import { getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { createRouter } from '../service/router';
import { OpsLevelController } from '../service/OpsLevelController';

describe('createRouter', () => {
  let app: express.Express;

  let controller: any;

  beforeAll(async () => {
    controller = {
      getAutoSyncConfiguration: jest.fn(),
      setAutoSyncConfiguration: jest.fn(),
      getAutoSyncExecutions: jest.fn(),
    };
    const identity: any = { getIdentity: async () => { return null; } }
    const router = await createRouter({
      logger: getVoidLogger(),
      controller: (controller as OpsLevelController),
      identity: identity,
    });
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /ping', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/ping');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'OpsLevel Backend Plugin is present' });
    });
  });

  describe('GET /auto_sync', () => {
    it('returns the configuration from the controller', async () => {
      controller.getAutoSyncConfiguration.mockReturnValueOnce(Promise.resolve({ "auto_sync_enabled": true, "auto_sync_schedule": "* * * *" }));

      const response = await request(app).get('/auto_sync');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ "auto_sync_enabled": true, "auto_sync_schedule": "* * * *" });
    });
  });

  describe('POST /auto_sync', () => {
    it('calls the controller with the new params and returns OK', async () => {
      const VALID_EXPRESSIONS = [
        "* * * * *",
        "0 0 12 * * *",
        "0 10/30 1,22 * *",
      ];

      for(const expression of VALID_EXPRESSIONS) {
        const config = { "auto_sync_enabled": true, "auto_sync_schedule": expression };
        const response = await request(app).post('/auto_sync').send(config);

        expect(controller.setAutoSyncConfiguration).toHaveBeenCalledWith(config);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({ "status": "ok" });
        jest.resetAllMocks();
      }
    });

    it('returns an error if the format is not right', async () => {
      const config = { "whatever": true, "lol": "no" };
      const response = await request(app).post('/auto_sync').send(config);

      expect(controller.setAutoSyncConfiguration).not.toHaveBeenCalled();
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({ "error": "Invalid request format" });
    });

    it('returns an error if the cron expression is invalid', async () => {
      const INVALID_EXPRESSIONS = [
        "hugo",
        "a a 2 * * *",
        "0 2 * * * 0 0",
        "12 34",
        "every day at 5am pls",
      ];

      for(const expression of INVALID_EXPRESSIONS) {
        const config = { "auto_sync_enabled": true, "auto_sync_schedule": expression };
        const response = await request(app).post('/auto_sync').send(config);

        expect(controller.setAutoSyncConfiguration).not.toHaveBeenCalled();
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({ "error": "Invalid cron expression" });
      }
    });
  });

  describe('POST /auto_sync/runs', () => {
    it('returns what the controller says if everything is right', async () => {
      const RESULT = {
        "total_count": "1",
        "rows": [{
          "id": 1
        }]
      };
      controller.getAutoSyncExecutions.mockReturnValueOnce(RESULT);
      
      const response = await request(app).post('/auto_sync/runs').send({ page_size: 1, page_number: 0 });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual(RESULT);
    });

    it('returns an error when the request is garbage', async () => {
      const response = await request(app).post('/auto_sync/runs').send({ page_size: "trololo", page_number: 0 });

      expect(response.status).toEqual(400);
      expect(response.body).toEqual({ "error": "Invalid request format" });
    });
  });
});
