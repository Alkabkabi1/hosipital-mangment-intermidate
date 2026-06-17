import type mysql from 'mysql2/promise';
import { dbPool } from '../core/database';

export async function withTransaction<T>(handler: (tx: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await handler(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    throw err;
  } finally {
    conn.release();
  }
}

