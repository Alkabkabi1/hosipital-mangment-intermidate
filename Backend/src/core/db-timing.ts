import type { Pool, PoolConnection } from 'mysql2/promise';
import { observeDbQuery } from '../middleware/metrics';

function wrapQuery(obj: any, context: string) {
  const origQuery = obj.query?.bind(obj);
  const origExecute = obj.execute?.bind(obj);
  if (origQuery) {
    obj.query = async (sql: any, params?: any) => {
      const t0 = Date.now();
      try {
        const res = await origQuery(sql, params);
        const ms = Date.now() - t0;
        observeDbQuery(ms, { op: 'query' });
        return res;
      } catch (e) {
        const ms = Date.now() - t0;
        observeDbQuery(ms, { op: 'query' });
        throw e;
      }
    };
  }
  if (origExecute) {
    obj.execute = async (sql: any, params?: any) => {
      const t0 = Date.now();
      try {
        const res = await origExecute(sql, params);
        const ms = Date.now() - t0;
        observeDbQuery(ms, { op: 'execute' });
        return res;
      } catch (e) {
        const ms = Date.now() - t0;
        observeDbQuery(ms, { op: 'execute' });
        throw e;
      }
    };
  }
}

export function attachDbTiming(pool: Pool): Pool {
  // Wrap pool-level methods
  wrapQuery(pool as any, 'pool');

  const origGet = pool.getConnection.bind(pool);
  pool.getConnection = (async function () {
    const conn: PoolConnection = await origGet();
    wrapQuery(conn as any, 'connection');
    return conn;
  }) as any;

  return pool;
}

