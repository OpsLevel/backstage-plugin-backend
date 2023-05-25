import { Logger } from 'winston';
import { PluginDatabaseManager } from '@backstage/backend-common';
import { PluginTaskScheduler } from '@backstage/backend-tasks';
export declare type OpslevelEnvironment = {
    logger: Logger;
    database: PluginDatabaseManager;
    scheduler?: PluginTaskScheduler;
};
export declare class OpslevelBuilder {
    private readonly env;
    static create(env: OpslevelEnvironment): OpslevelBuilder;
    private constructor();
    build(): Promise<import("express").Router>;
}
