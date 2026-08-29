import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

const tables: Record<string, string> = { users: 'users', loans: 'loans', contributions: 'contributions', auditLogs: 'audit_logs', settings: 'settings' };
export async function GET(_req: Request, { params }: { params: Promise<{ collection: string }> }) { const { collection } = await params; const table = tables[collection]; if (!table) return NextResponse.json({data:[]}); const [rows] = await db.query(`SELECT * FROM \`${table}\` ORDER BY created_at DESC`); return NextResponse.json({ data: rows }); }
export async function POST(req: Request, { params }: { params: Promise<{ collection: string }> }) { const { collection } = await params; const table = tables[collection]; if (!table) return NextResponse.json({error:'Unknown collection'}, {status:400}); const body = await req.json(); const id = body.id || randomUUID(); const fields = Object.keys(body).filter(k => k !== 'id'); const values = fields.map(k => body[k]); await db.query(`INSERT INTO \`${table}\` (id,${fields.map(k => `\`${k}\``).join(',')}) VALUES (?,${fields.map(() => '?').join(',')})`, [id, ...values]); return NextResponse.json({ id }, {status:201}); }
