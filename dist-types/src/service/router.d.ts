import express from 'express';
import { Logger } from 'winston';
export interface RouterOptions {
    logger: Logger;
}
export declare function createRouter(options: RouterOptions): Promise<express.Router>;
