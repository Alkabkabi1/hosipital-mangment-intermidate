import { loadEnv, env } from './config';
// Fail-fast on invalid configuration
loadEnv();
import { initTracing } from './tracing/otel';
import { createApp } from './app';
import { seedDefaultAdmin } from './core/bootstrap';
import { assertDatabaseConnection, dbPool } from './core/database';
import { registerGracefulShutdown } from './core/graceful';
import { logger } from './core/logger';

async function start() {
  // Optional tracing init (before app creation)
  await initTracing();
  await assertDatabaseConnection();
  logger.info('Database connection verified');

  await seedDefaultAdmin();

  const app = createApp();

  const host = env.HOST ?? '0.0.0.0';
  const server = app.listen(env.PORT, host, () => {
    logger.info({ port: env.PORT, host }, 'API server listening');
  });

  registerGracefulShutdown({ appServer: server, dbPool, logger });
}

start().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});
