import { getVoidLogger } from '@backstage/backend-common';
import { PluginTaskScheduler } from "@backstage/backend-tasks";
import { OpsLevelController } from '../service/OpsLevelController';
import { OpsLevelDatabase } from '../database/OpsLevelDatabase';

describe('OpsLevelController', () => {
  let controller: any;
  let db: any;
  let scheduler: any;
  let catalog: any;
  let config: any;
  let opsLevelApi: any;

  beforeAll(async () => {
    db = {
      fetchConfigValue: jest.fn(),
      setConfigValues: jest.fn(),
      fetchExportRuns: jest.fn(),
      upsertExportRun: jest.fn(),
    }
    scheduler = {
      scheduleTask: jest.fn(),
    }
    catalog = {
      getEntities: jest.fn(),
    }
    config = {
      getString: jest.fn(),
    }
    opsLevelApi = {
      exportEntity: jest.fn(),
    }
    controller = new OpsLevelController(
      (db as OpsLevelDatabase),
      getVoidLogger(),
      (scheduler as PluginTaskScheduler),
      catalog,
      config,
      opsLevelApi
    )
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getAutoSyncConfiguration', () => {
    it('returns what the database says if there is a configuration', async () => {
      db.fetchConfigValue.mockReturnValueOnce("true").mockReturnValueOnce("* * * *");

      const response = await controller.getAutoSyncConfiguration();

      expect(db.fetchConfigValue).toHaveBeenNthCalledWith(1, "auto_sync_enabled");
      expect(db.fetchConfigValue).toHaveBeenNthCalledWith(2, "auto_sync_schedule");
      expect(response).toEqual({ "auto_sync_enabled": true, "auto_sync_schedule": "* * * *" });
    });

    it('returns the default if there is no configuration in the DB', async () => {
      const response = await controller.getAutoSyncConfiguration();

      expect(response).toEqual({ "auto_sync_enabled": false, "auto_sync_schedule": "" });
    });
  });

  describe('setAutoSyncConfiguration', () => {
    it('forwards the configuration to the database and does not schedule a task if disabled', async () => {
      await controller.setAutoSyncConfiguration({ "auto_sync_enabled": false, "auto_sync_schedule": "* * * *" });

      expect(db.setConfigValues).toHaveBeenCalledWith([
        {"key": "auto_sync_enabled", "value": "false"},
        {"key": "auto_sync_schedule", "value": "* * * *"}
      ]);
      expect(scheduler.scheduleTask).not.toHaveBeenCalled();
    });

    it('forwards the configuration to the database and does schedule a task if enabled', async () => {
      db.fetchConfigValue.mockReturnValueOnce("true").mockReturnValueOnce("* * * *");
      await controller.setAutoSyncConfiguration({ "auto_sync_enabled": true, "auto_sync_schedule": "* * * *" });

      expect(db.setConfigValues).toHaveBeenCalledWith([
        {"key": "auto_sync_enabled", "value": "true"},
        {"key": "auto_sync_schedule", "value": "* * * *"}
      ]);
      expect(scheduler.scheduleTask).toHaveBeenCalled();
      const args = scheduler.scheduleTask.mock.calls[0][0];
      expect({...args, fn: undefined, signal: undefined}).toEqual({
        "fn": undefined,
        "frequency": {"cron": "* * * *"},
        "id": "opslevel-exporter",
        "initialDelay": {"seconds": 10},
        "scope": "global",
        "signal": undefined,
        "timeout": {"days": 1}
      });
    });
  });

  describe('getAutoSyncExecutions', () => {
    it('returns what the database returns', async () => {
      const RESULT = {
        "total_count": "1",
        "rows": [{
          "id": 1
        }]
      };

      db.fetchExportRuns.mockReturnValueOnce(RESULT);
      const result = await controller.getAutoSyncExecutions(0, 1);

      expect(result).toEqual(RESULT);
      expect(db.fetchExportRuns).toHaveBeenCalledWith(0, 1);
    });
  });

  describe('scheduleAutoSyncIfApplicable', () => {
    it('schedules a task if that is so configured', async () => {
      db.fetchConfigValue.mockReturnValueOnce("true").mockReturnValueOnce("* * * *");

      await controller.scheduleAutoSyncIfApplicable();

      expect(scheduler.scheduleTask).toHaveBeenCalled();
      const args = scheduler.scheduleTask.mock.calls[0][0];
      expect({...args, fn: undefined, signal: undefined}).toEqual({
        "fn": undefined,
        "frequency": {"cron": "* * * *"},
        "id": "opslevel-exporter",
        "initialDelay": {"seconds": 10},
        "scope": "global",
        "signal": undefined,
        "timeout": {"days": 1}
      });
    });

    it('does not schedule a task if that is so configured', async () => {
      db.fetchConfigValue.mockReturnValueOnce("false").mockReturnValueOnce("* * * *");

      await controller.scheduleAutoSyncIfApplicable();

      expect(scheduler.scheduleTask).not.toHaveBeenCalled();
    });

    it('sends an abort signal if a task already exists and a new one is scheduled', async () => {
      db.fetchConfigValue.mockReturnValueOnce("true").mockReturnValueOnce("* * * *");
      await controller.scheduleAutoSyncIfApplicable();

      expect(scheduler.scheduleTask).toHaveBeenCalled();
      const firstTaskAbortSignal = scheduler.scheduleTask.mock.calls[0][0].signal;
      expect(firstTaskAbortSignal.aborted).toBe(false);

      jest.resetAllMocks();
      db.fetchConfigValue.mockReturnValueOnce("true").mockReturnValueOnce("* * * *");
      await controller.scheduleAutoSyncIfApplicable();
      expect(firstTaskAbortSignal.aborted).toBe(true);
      const secondTaskAbortSignal = scheduler.scheduleTask.mock.calls[0][0].signal;
      expect(secondTaskAbortSignal.aborted).toBe(false);
    });
  });

  describe('exportToOpsLevel', () => {
    it('calls the OpsLevel GraphQL API for each entity when everything goes well', async () => {     
      const USERS = [ { kind: "user", "name": "User 1" }, { kind: "user", "name": "User 2" } ];
      const GROUPS = [ { kind: "group", "name": "Group 1" }, { kind: "group", "name": "Group 2" } ];
      const COMPONENTS = [ { kind: "component", "name": "Component 1" }, { kind: "component", "name": "Component 2" } ];

      db.upsertExportRun.mockReturnValue(Promise.resolve(1));

      catalog.getEntities
        .mockReturnValueOnce({ "items": USERS })
        .mockReturnValueOnce({ "items": GROUPS })
        .mockReturnValueOnce({ "items": COMPONENTS });

      await controller.exportToOpsLevel(new AbortController().signal);

      expect(catalog.getEntities).toHaveBeenCalledTimes(3);
      expect(catalog.getEntities).toHaveBeenNthCalledWith(1, {"filter": {"kind": "user"}});
      expect(catalog.getEntities).toHaveBeenNthCalledWith(2, {"filter": {"kind": "group"}});
      expect(catalog.getEntities).toHaveBeenNthCalledWith(3, {"filter": {"kind": "component"}});

      expect(db.upsertExportRun).toHaveBeenCalledTimes(5);
      const { trigger, state, completed_at, output } = db.upsertExportRun.mock.calls[4][0];
      expect(trigger).toEqual("scheduled");
      expect(state).toEqual("completed");
      expect(completed_at).not.toBe(null);
      expect(output).toContain("Loaded 2 entities of type user from Backstage");
      expect(output).toContain("Loaded 2 entities of type group from Backstage");
      expect(output).toContain("Loaded 2 entities of type component from Backstage");
      expect(output).toContain("Exporting user:default/user 1...");
      expect(output).toContain("Exporting user:default/user 2...");
      expect(output).toContain("Exporting group:default/group 1...");
      expect(output).toContain("Exporting group:default/group 2...");
      expect(output).toContain("Exporting component:default/component 1...");
      expect(output).toContain("Exporting component:default/component 2...");

      
      expect(opsLevelApi.exportEntity).toHaveBeenCalledTimes(6);
      expect(opsLevelApi.exportEntity).toHaveBeenNthCalledWith(1, USERS[0]);
      expect(opsLevelApi.exportEntity).toHaveBeenNthCalledWith(2, USERS[1]);
      expect(opsLevelApi.exportEntity).toHaveBeenNthCalledWith(3, GROUPS[0]);
      expect(opsLevelApi.exportEntity).toHaveBeenNthCalledWith(4, GROUPS[1]);
      expect(opsLevelApi.exportEntity).toHaveBeenNthCalledWith(5, COMPONENTS[0]);
      expect(opsLevelApi.exportEntity).toHaveBeenNthCalledWith(6, COMPONENTS[1]);
    });

    it('aborts and records that in the log when the signal says so', async () => {
      const USERS = [ { kind: "user", "name": "User 1" }, { kind: "user", "name": "User 2" } ];

      db.upsertExportRun.mockReturnValue(Promise.resolve(1));

      catalog.getEntities.mockReturnValueOnce({ "items": USERS });

      const abortController = new AbortController();
      abortController.abort();
      await controller.exportToOpsLevel(abortController.signal);

      expect(catalog.getEntities).toHaveBeenCalledTimes(1);
      expect(opsLevelApi.exportEntity).toHaveBeenCalledTimes(1);

      expect(db.upsertExportRun).toHaveBeenCalledTimes(2);
      const { trigger, state, completed_at, output } = db.upsertExportRun.mock.calls[1][0];
      expect(trigger).toEqual("scheduled");
      expect(state).toEqual("failed");
      expect(completed_at).toBe(null);
      expect(output).toContain("Loaded 2 entities of type user from Backstage");
      expect(output).toContain("Exporting user:default/user 1...");
      expect(output).not.toContain("Exporting user:default/user 2...");
      expect(output).toContain("Abort signal received");
    });

    it('records an error if OpsLevel is unreachable', async () => {
      const USERS = [ { kind: "user", "name": "User 1" }, { kind: "user", "name": "User 2" } ];

      db.upsertExportRun.mockReturnValue(Promise.resolve(1));

      catalog.getEntities.mockReturnValueOnce({ "items": USERS });

      opsLevelApi.exportEntity.mockImplementation(() => { throw Error("Could not connect!"); });

      await controller.exportToOpsLevel(new AbortController().signal);

      expect(catalog.getEntities).toHaveBeenCalledTimes(1);
      expect(opsLevelApi.exportEntity).toHaveBeenCalledTimes(1);

      expect(db.upsertExportRun).toHaveBeenCalledTimes(2);
      const { trigger, state, completed_at, output } = db.upsertExportRun.mock.calls[1][0];
      expect(trigger).toEqual("scheduled");
      expect(state).toEqual("failed");
      expect(completed_at).toBe(null);
      expect(output).toContain("Loaded 2 entities of type user from Backstage");
      expect(output).toContain("Exporting user:default/user 1...");
      expect(output).not.toContain("Exporting user:default/user 2...");
      expect(output).toContain("Error: Could not connect!");
    });
  });
});
