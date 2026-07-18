import { env } from '../config/env';

/* eslint-disable no-console */

/**
 * Centralized logging so we have exactly one place to redirect output to a
 * crash/analytics reporter (Sentry, Crashlytics, Datadog) later, and one
 * place to strip verbose logs in production builds.
 */
export const logger = {
  debug(message: string, meta?: unknown): void {
    if (env.envName === 'production') return;
    console.log(`[debug] ${message}`, meta ?? '');
  },
  warn(message: string, meta?: unknown): void {
    console.warn(`[warn] ${message}`, meta ?? '');
  },
  error(message: string, meta?: unknown): void {
    console.error(`[error] ${message}`, meta ?? '');
  },
};
