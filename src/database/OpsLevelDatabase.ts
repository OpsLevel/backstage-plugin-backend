import { Logger } from "winston";
import { OpslevelConfigRow, OpslevelExportRun } from "./tables";
import { Knex } from "knex";

export class OpsLevelDatabase {
  private database: Knex;
  private logger: Logger;

  public constructor(database: Knex, logger: Logger) {
    this.database = database;
    this.logger = logger;
  }

  async fetchConfigValue(key: string): Promise<string | null> {
    const ret = await this.database<OpslevelConfigRow>('opslevel_config').where('key', key).select('value');
    if(ret.length === 0) return null;
    return ret[0].value;
  }

  async setConfigValues(entries: Array<{key: string, value: string | null}>) {
    const tx = await this.database.transaction();
    try {
      for (let i = 0; i < entries.length; i++) {
        this.logger.info(`Received new OpsLevel configuration record: ${entries[i].key}=${entries[i].value}`);
        await this.database<OpslevelConfigRow>('opslevel_config').transacting(tx).insert(entries[i]).onConflict("key").merge();
      }
    } catch (e) {
      await tx.rollback();
      throw e;
    }
    await tx.commit();
  }

  async fetchExportRuns(pageNumber: number | null, pageSize: number | null) {
    let query = this.database<OpslevelExportRun>('opslevel_export_run');
    if(pageNumber !== null && pageSize !== null) {
      query = query.offset(pageSize * pageNumber).limit(pageSize);
    }
    const count: { [key: string]: number | string } | undefined = await this.database('opslevel_export_run').count("id as count").first();
    return {
      total_count: count?.count,
      rows: await query.select("*").orderBy("id", "desc")
    }
  }

  async upsertExportRun(run: OpslevelExportRun): Promise<number> {
    return this.database.transaction()
      .then(async (tx) => {
        const ret = await this.database('opslevel_export_run')
          .transacting(tx)
          .insert(run)
          .onConflict("id")
          .merge()
          .returning("id");
        await tx.commit();
        return ret[0].id;
      })
  }
}
