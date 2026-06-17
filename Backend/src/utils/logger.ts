type Level = 'fatal'|'error'|'warn'|'info'|'debug'|'trace';

function nowIso() { return new Date().toISOString(); }

function base(userId?: number|string, requestId?: string) {
  const ctx: any = { ts: nowIso() };
  if (userId !== undefined) ctx.userId = userId;
  if (requestId) ctx.requestId = requestId;
  return ctx;
}

function write(level: Level, msg: string, extra?: Record<string, unknown>, userId?: number|string, requestId?: string) {
  const rec = { level, msg, ...base(userId, requestId), ...(extra || {}) };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(rec));
}

export const logger = {
  info: (msg: string, extra?: Record<string, unknown>, userId?: number|string, requestId?: string) => write('info', msg, extra, userId, requestId),
  warn: (msg: string, extra?: Record<string, unknown>, userId?: number|string, requestId?: string) => write('warn', msg, extra, userId, requestId),
  error: (msg: string, extra?: Record<string, unknown>, userId?: number|string, requestId?: string) => write('error', msg, extra, userId, requestId),
  debug: (msg: string, extra?: Record<string, unknown>, userId?: number|string, requestId?: string) => write('debug', msg, extra, userId, requestId),
};

