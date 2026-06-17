import mysql from 'mysql2/promise';

import { env } from '../config';
import { attachDbTiming } from './db-timing';

export const dbPool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

attachDbTiming(dbPool);

export async function withConnection<T>(handler: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const connection = await dbPool.getConnection();
  try {
    return await handler(connection);
  } finally {
    connection.release();
  }
}

export async function withTransaction<T>(handler: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function assertDatabaseConnection(): Promise<void> {
  const connection = await dbPool.getConnection();
  await connection.ping();
  connection.release();
}
