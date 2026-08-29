import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise';

declare global { var __coopPool: Pool | undefined; }

export const db = global.__coopPool ?? mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_DATABASE || 'cooperatives_db',
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

if (process.env.NODE_ENV !== 'production') global.__coopPool = db;

export type DbRow = RowDataPacket & Record<string, unknown>;
