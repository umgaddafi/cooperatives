import { cookies } from 'next/headers';
import { randomBytes, randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './db';

const SESSION_DAYS = 7;

export async function createSession(userId: string) {
  const id = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.execute('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', [id, userId, expires]);
  (await cookies()).set('coop_session', id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', expires, path: '/' });
}

export async function currentUser() {
  const id = (await cookies()).get('coop_session')?.value;
  if (!id) return null;
  const [rows] = await db.execute(`SELECT u.id,u.name,u.email,u.role,u.memberId,u.totalSavings,u.joinDate,u.status
    FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at > NOW() LIMIT 1`, [id]);
  return (rows as any[])[0] || null;
}

export async function signIn(email: string, password: string) {
  const [rows] = await db.execute('SELECT id,password AS password_hash,status FROM users WHERE email=? LIMIT 1', [email.toLowerCase().trim()]);
  const user = (rows as any[])[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new Error('INVALID_CREDENTIALS');
  if (user.status !== 'Active') throw new Error('ACCOUNT_PENDING');
  await createSession(user.id);
}

export async function signOut() {
  const jar = await cookies();
  const id = jar.get('coop_session')?.value;
  if (id) await db.execute('DELETE FROM sessions WHERE id=?', [id]);
  jar.delete('coop_session');
}

export { bcrypt, randomUUID };
