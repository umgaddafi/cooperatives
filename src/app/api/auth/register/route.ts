import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bcrypt, randomUUID } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password || password.length < 8) return NextResponse.json({ error: 'Name, email and an 8-character password are required.' }, { status: 422 });
    const id = randomUUID();
    const memberId = `MB-${Math.floor(1000 + Math.random() * 9000)}`;
    const hash = await bcrypt.hash(password, 12);
    await db.execute('INSERT INTO users (id,name,email,password,memberId,joinDate,status) VALUES (?,?,?,?,?,?,?)', [id, name.trim(), email.toLowerCase().trim(), hash, memberId, new Date().toISOString().slice(0, 10), 'Pending']);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.code === 'ER_DUP_ENTRY' ? 'An account with this email already exists.' : 'Registration failed.' }, { status: 400 });
  }
}
