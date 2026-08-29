import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

const tables: Record<string, string> = { users: 'users', loans: 'loans', contributions: 'contributions', auditLogs: 'audit_logs', settings: 'settings' };
const columns: Record<string, string[]> = {
  users: ['id', 'name', 'email', 'role', 'memberId', 'totalSavings', 'joinDate', 'status', 'createdAt'],
  loans: ['id', 'userId', 'memberName', 'amount', 'loanTypeId', 'status', 'createdAt'],
  contributions: ['id', 'userId', 'amount', 'type', 'date', 'status'],
  auditLogs: ['id', 'action', 'actor', 'actorRole', 'target', 'timestamp', 'status'],
  settings: ['id', 'updated_at'],
};
const defaultOrder: Record<string, string> = {
  users: 'createdAt',
  loans: 'createdAt',
  contributions: 'date',
  auditLogs: 'timestamp',
  settings: 'updated_at',
};

export async function GET(req: Request, { params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const table = tables[collection];
  if (!table) return NextResponse.json({ data: [] });

  const url = new URL(req.url);
  const allowedColumns = columns[collection] || [];
  const clauses: string[] = [];
  const values: unknown[] = [];

  url.searchParams.forEach((value, key) => {
    if (!key.startsWith('filter.')) return;
    const field = key.slice('filter.'.length);
    if (!allowedColumns.includes(field)) return;
    clauses.push(`\`${field}\` = ?`);
    values.push(value);
  });

  const requestedOrder = url.searchParams.get('order') || defaultOrder[collection];
  const orderColumn = allowedColumns.includes(requestedOrder) ? requestedOrder : defaultOrder[collection];
  const direction = url.searchParams.get('direction')?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const requestedLimit = Number(url.searchParams.get('limit') || 100);
  const rowLimit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100;
  const whereSql = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';

  const [rows] = await db.query(
    `SELECT * FROM \`${table}\`${whereSql} ORDER BY \`${orderColumn}\` ${direction} LIMIT ?`,
    [...values, rowLimit],
  );

  return NextResponse.json({ data: rows });
}
export async function POST(req: Request, { params }: { params: Promise<{ collection: string }> }) { const { collection } = await params; const table = tables[collection]; if (!table) return NextResponse.json({error:'Unknown collection'}, {status:400}); const body = await req.json(); const id = body.id || randomUUID(); const fields = Object.keys(body).filter(k => k !== 'id'); const values = fields.map(k => body[k]); await db.query(`INSERT INTO \`${table}\` (id,${fields.map(k => `\`${k}\``).join(',')}) VALUES (?,${fields.map(() => '?').join(',')})`, [id, ...values]); return NextResponse.json({ id }, {status:201}); }
