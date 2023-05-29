import { Logger } from "winston";
import { OpsLevelDatabase } from "../database/OpsLevelDatabase";
import { AutoSyncConfiguration } from "../types";
import { PluginTaskScheduler } from "@backstage/backend-tasks";
import { CatalogApi } from '@backstage/catalog-client';
import { OpsLevelGraphqlAPI } from "./OpsLevelGraphqlAPI";
import { Config } from "@backstage/config";
import { stringifyEntityRef } from "@backstage/catalog-model";
import { OpslevelExportRun } from "../database/tables";
import { AbortController, AbortSignal } from 'node-abort-controller';

export type OpsLevelControllerEnvironment = {
  logger: Logger;
  db: OpsLevelDatabase;
  scheduler: PluginTaskScheduler;
  catalogClient: CatalogApi;
};

export class OpsLevelController {
  private db: OpsLevelDatabase;
  private logger: Logger;
  private scheduler: PluginTaskScheduler;
  private running_task_abort_controller: AbortController | undefined;
  private catalog: CatalogApi;
  private opsLevel: OpsLevelGraphqlAPI;

  public constructor(db: OpsLevelDatabase, logger: Logger, scheduler: PluginTaskScheduler, catalog: CatalogApi, config: Config, opsLevelApi: OpsLevelGraphqlAPI | null = null) {
    this.db = db;
    this.logger = logger;
    this.scheduler = scheduler;
    this.catalog = catalog;
    this.opsLevel = opsLevelApi || new OpsLevelGraphqlAPI(config.getString('backend.baseUrl'));
  }

  public async getAutoSyncConfiguration() {
    return {
      "auto_sync_enabled": (await this.db.fetchConfigValue("auto_sync_enabled") === "true"),
      "auto_sync_schedule": await this.db.fetchConfigValue("auto_sync_schedule") || "",
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
        timeout: { days: 1 },
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
    const runRecord: OpslevelExportRun = await this.prepareRunRecord();
    let messagesToPush: Array<string> = [];
    try {
      for(const kind of ['user', 'group', 'component']) {
        const entities = await this.catalog.getEntities({ filter: { kind }});
        messagesToPush.push(this.ts(`Loaded ${entities.items.length} entities of type ${kind} from Backstage`));
        for(let i = 0; i < entities.items.length; i++) {
          const entity = entities.items[i];
          messagesToPush.push(this.ts(`Exporting ${stringifyEntityRef(entity)}...`));
          try {
            await this.opsLevel.exportEntity(entity)
          } catch (e) {
            messagesToPush.push(this.ts(`Error: ${e instanceof Error ? e.message : e}`));
            throw e;
          }
          if(abortSignal.aborted) {
            messagesToPush.push(this.ts("Abort signal received"));
            throw new Error();
          }
          if (i > 0 && i%5 === 0) messagesToPush = await this.updateRunRecord(runRecord, messagesToPush);
        }
        messagesToPush = await this.updateRunRecord(runRecord, messagesToPush);
      };
    } catch (e) {
      messagesToPush.push(this.ts("Export task failed"));
      runRecord.state = "failed";
    }
    this.logger.info("Entity export to OpsLevel complete");
    if(runRecord.state !== "failed") { 
      runRecord.state = "completed";
      runRecord.completed_at = new Date();
    }
    await this.updateRunRecord(runRecord, messagesToPush);
  }

  private async updateRunRecord(runRecord: OpslevelExportRun, messages: Array<string>) {
    if(messages.length > 0) runRecord.output += `\n${  messages.join("\n")}`;
    runRecord.id = await this.db.upsertExportRun(runRecord);
    return [];
  }

  private ts(message: string) {
    return `${new Date().toUTCString()}: ${message}`;
  }

  private async prepareRunRecord(): Promise<OpslevelExportRun> {
    const ret: OpslevelExportRun = {
      trigger: "scheduled",
      state: "running",
      started_at: new Date(),
      completed_at: null,
      output: this.ts("Export to OpsLevel has started"),
    };
    ret.id = await this.db.upsertExportRun(ret);
    return ret;
  }
}
