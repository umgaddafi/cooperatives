import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const [rows] = await db.execute('SELECT settings_json FROM settings WHERE id=? LIMIT 1', ['global']);
  const row = (rows as any[])[0];
  return NextResponse.json(row ? (typeof row.settings_json === 'string' ? JSON.parse(row.settings_json) : row.settings_json) : {});
}
