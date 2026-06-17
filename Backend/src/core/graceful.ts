import type { Pool } from 'mysql2/promise';
import type { Server } from 'http';

type LoggerLike = { info: (...a: any[]) => void; warn: (...a: any[]) => void; error: (...a: any[]) => void };

export function registerGracefulShutdown(opts: {
  appServer: Server;
  dbPool: Pool;
  logger: LoggerLike;
  timeoutMs?: number;
}) {
  const { appServer, dbPool, logger } = opts;
  const timeoutMs = opts.timeoutMs ?? Number(process.env.DRAIN_TIMEOUT_MS || 10000);

  let shuttingDown = false;

  async function closeServer(): Promise<void> {
    return new Promise((resolve) => {
      if (!appServer.listening) return resolve();
      appServer.close(() => resolve());
    });
  }

  async function shutdown(signal: NodeJS.Signals) {
    if (shuttingDown) {
      logger.warn({ signal }, 'Shutdown already in progress');
      return;
    }
    shuttingDown = true;
    logger.info({ signal }, 'Starting graceful shutdown');

    const timer = setTimeout(() => {
      logger.error({ timeoutMs }, 'Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, timeoutMs);

    try {
      logger.info('Stopping HTTP server (stop accepting new connections)');
      await closeServer();
      logger.info('HTTP server closed');
    } catch (err) {
      logger.error({ err }, 'Error while closing HTTP server');
    }
    try {
      logger.info('Closing DB pool');
      await dbPool.end();
      logger.info('DB pool closed');
    } catch (err) {
      logger.error({ err }, 'Error while closing DB pool');
    }
    clearTimeout(timer);
    logger.info('Shutdown complete, exiting 0');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

