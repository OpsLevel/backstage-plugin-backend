import { LoggerService, SchedulerService } from "@backstage/backend-plugin-api";
import { OpsLevelDatabase } from "../database/OpsLevelDatabase";
import { AutoSyncConfiguration } from "../types";
import { CatalogApi } from '@backstage/catalog-client';
import { ExportEntityResponse, OpsLevelGraphqlAPI } from "./OpsLevelGraphqlAPI";
import { Config } from "@backstage/config";
import { stringifyEntityRef, Entity } from "@backstage/catalog-model";
import { OpslevelExportRun } from "../database/tables";

const PUSH_EVERY_LINES = 5;

class RunRecordHandler {
  private runRecord: OpslevelExportRun;
  private messages: Array<string>;
  private db: OpsLevelDatabase;

  private constructor(runRecord: OpslevelExportRun, db: OpsLevelDatabase) {
    this.runRecord = runRecord;
    this.db = db;
    this.messages = [];
  }

  static build(db: OpsLevelDatabase) {
    return this.prepareRunRecord(db)
      .then((runRecord) => {
        return new RunRecordHandler(runRecord, db);
      });
  }

  public async message(msg: string) {
    this.messages.push(RunRecordHandler.ts(msg));
    const n = this.messages.length;
    if (n >= PUSH_EVERY_LINES) await this.updateRunRecord();
  }

  public async setState(state: "running" | "completed" | "failed") {
    if(state === "completed") this.runRecord.completed_at = new Date();
    this.runRecord.state = state;
  }

  public async finalize() {
    await this.message(`Export to OpsLevel ended with status "${this.runRecord.state}"`);
    await this.updateRunRecord();
  }

  private static async prepareRunRecord(db: OpsLevelDatabase): Promise<OpslevelExportRun> {
    const ret: OpslevelExportRun = {
      trigger: "scheduled",
      state: "running",
      started_at: new Date(),
      completed_at: null,
      output: this.ts("Export to OpsLevel has started"),
    };
    ret.id = await db.upsertExportRun(ret);
    return ret;
  }

  private async updateRunRecord() {
    if(this.messages.length > 0) this.runRecord.output += `\n${ this.messages.join("\n") }`;
    this.runRecord.id = await this.db.upsertExportRun(this.runRecord);
    this.messages = [];
  }

  private static ts(message: string) {
    return `${new Date().toUTCString()}: ${message}`;
  }
}

export class OpsLevelController {
  private db: OpsLevelDatabase;
  private logger: LoggerService;
  private scheduler: SchedulerService;
  private running_task_abort_controller: AbortController | undefined;
  private catalog: CatalogApi;
  private opsLevel: OpsLevelGraphqlAPI;

  public constructor(db: OpsLevelDatabase, logger: LoggerService, scheduler: SchedulerService, catalog: CatalogApi, config: Config, opsLevelApi: OpsLevelGraphqlAPI | null = null) {
    this.db = db;
    this.logger = logger;
    this.scheduler = scheduler;
    this.catalog = catalog;
    this.opsLevel = opsLevelApi || new OpsLevelGraphqlAPI(config.getString('backend.baseUrl'));
  }

  public async getAutoSyncConfiguration() {
    return {
      "auto_sync_enabled": (await this.db.fetchConfigValue("auto_sync_enabled") === "true"),
      "auto_sync_schedule": await this.db.fetchConfigValue("auto_sync_schedule") || "0 * * * *",
    }
  }

  public async setAutoSyncConfiguration(value: AutoSyncConfiguration) {
    await this.db.setConfigValues([
      { key: "auto_sync_enabled", value: value.auto_sync_enabled.toString() },
      { key: "auto_sync_schedule", value: value.auto_sync_schedule }
    ]);
    await this.scheduleAutoSyncIfApplicable();
  }

  public async getAutoSyncExecutions(pageNumber: number | null, pageSize: number | null) {
    return this.db.fetchExportRuns(pageNumber, pageSize);
  }

  public async scheduleAutoSyncIfApplicable() {
    this.logger.info("Reconfiguring auto-sync task");
    if(this.running_task_abort_controller) {
      this.logger.info("Cancelling active task schedule");
      this.running_task_abort_controller.abort();
      this.running_task_abort_controller = undefined;
    }
    const { auto_sync_enabled, auto_sync_schedule } = await this.getAutoSyncConfiguration();
    if (auto_sync_enabled) {
      this.logger.info(`Scheduling new task according to configuration: ${auto_sync_schedule}`)
      this.running_task_abort_controller = new AbortController();
      this.scheduler.scheduleTask({
        frequency: { cron: auto_sync_schedule },
        timeout: { hours: 2 },
        initialDelay: { seconds: 10 },
        id: "opslevel-exporter",
        fn: async (abortSignal: AbortSignal) => { await this.exportToOpsLevel(abortSignal) },
        signal: this.running_task_abort_controller.signal,
        scope: 'global',
      });
    } else {
      this.logger.info("Auto-sync is disabled; not scheduling new task");
    }
  }

  public async exportToOpsLevel(abortSignal: AbortSignal) {
    this.logger.info("Exporting entities to OpsLevel");
    const recordHandler: RunRecordHandler = await RunRecordHandler.build(this.db);
    try {
      for(const kind of ['user', 'group', 'component']) {
        const entities = await this.loadEntities(kind, recordHandler);
        await this.performEntityExport(entities.items, recordHandler, abortSignal);
      }
      await recordHandler.setState("completed");
    } catch (e) {
      this.logger.error(`${e}`);
      await recordHandler.message(`Error: ${e instanceof Error ? e.message : e}`);
      await recordHandler.message("Export task failed")
      await recordHandler.setState("failed");
    }
    await recordHandler.finalize();
  }

  private async loadEntities(kind: string, recordHandler: RunRecordHandler) {
    const entities = await this.catalog.getEntities({ filter: { kind }});
    await recordHandler.message(`Loaded ${entities.items.length} entities of type ${kind} from Backstage`);
    return entities;
  }

  private async performEntityExport(entities: Array<Entity>, recordHandler: RunRecordHandler, abortSignal: AbortSignal) {
    for(const entity of entities) {
      await recordHandler.message(`Exporting ${stringifyEntityRef(entity)}...`);
      try {
        const response: ExportEntityResponse = await this.opsLevel.exportEntity(entity)
        await recordHandler.message(`Response: ${response.importEntityFromBackstage.actionMessage}`);
        if (response.importEntityFromBackstage.errors.length) {
          await recordHandler.message(`Error: ${response.importEntityFromBackstage.errors[0].message}`)
        }
      } catch (e) {
        await recordHandler.message(`Error: ${e instanceof Error ? e.message : e}`);
        throw e;
      }
      if(abortSignal.aborted) {
        await recordHandler.message("Abort signal received");
        throw new Error();
      }
    }
  }
}
