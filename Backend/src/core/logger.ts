import pino from 'pino';

import { env, isProduction } from '../config';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
