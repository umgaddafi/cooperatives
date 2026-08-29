import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
const tables: Record<string, string> = { users: 'users', loans: 'loans', contributions: 'contributions', auditLogs: 'audit_logs', settings: 'settings' };
export async function GET(_req: Request, { params }: { params: Promise<{collection:string;id:string}> }) { const p=await params; const table=tables[p.collection]; if(!table)return NextResponse.json({data:null},{status:404}); const [rows]=await db.query(`SELECT * FROM \`${table}\` WHERE id=? LIMIT 1`,[p.id]); return NextResponse.json({data:(rows as any[])[0]||null}); }
export async function PATCH(req: Request, { params }: { params: Promise<{collection:string;id:string}> }) { const p=await params; const table=tables[p.collection]; const body=await req.json(); const fields=Object.keys(body); await db.query(`UPDATE \`${table}\` SET ${fields.map(k=>`\`${k}\`=?`).join(',')} WHERE id=?`,[...fields.map(k=>body[k]),p.id]); return NextResponse.json({ok:true}); }
