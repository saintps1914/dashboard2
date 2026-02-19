import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, toPublicUser } from '@/lib/userStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emailOrUsername: string = body.email?.toString().toLowerCase() ?? '';
    const password: string = body.password?.toString() ?? '';

    if (!emailOrUsername || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const users = await getAllUsers();

    const user = users.find((u) => {
      const email = u.email.toLowerCase();
      const username = u.username.toLowerCase();
      const needle = emailOrUsername.toLowerCase();
      return (email === needle || username === needle) && u.password === password;
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: toPublicUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
