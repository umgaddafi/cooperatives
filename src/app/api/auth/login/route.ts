import { NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required.' }, { status: 422 });
    await signIn(email, password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: code === 'ACCOUNT_PENDING' ? 'Your account is awaiting approval.' : 'Invalid email or password.' }, { status: 401 });
  }
}
