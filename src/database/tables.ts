export type OpslevelConfigRow = {
  key: string;
  value: string | null;
};

export type OpslevelExportRun = {
  id?: number;
  trigger: "manual" | "scheduled";
  state: "running" | "completed" | "failed";
  started_at: Date;
  completed_at: Date | null;
  output: string;
}
