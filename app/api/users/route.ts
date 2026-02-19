import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromCookie } from '@/lib/auth';
import {
  getAllUsers,
  saveAllUsers,
  toPublicUser,
  generatePassword,
  type WidgetToggles,
  type UserRecord,
  type VisibilitySettings,
} from '@/lib/userStore';

function normalizeWidgets(w: Partial<WidgetToggles> | null | undefined): WidgetToggles {
  return {
    managerTasks: w?.managerTasks ?? true,
    specialistTasks: w?.specialistTasks ?? true,
    salesReport: w?.salesReport ?? true,
    callsByManager: w?.callsByManager ?? true,
  };
}

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = getSessionUserFromCookie(cookieHeader);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
  }
  const users = await getAllUsers();
  return NextResponse.json({ users: users.map(toPublicUser) });
}

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = getSessionUserFromCookie(cookieHeader);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, widgets, visibility_settings, action } = body as {
      id?: string;
      widgets?: Partial<WidgetToggles>;
      visibility_settings?: VisibilitySettings;
      action?: 'add' | 'update';
    };

    if (action === 'add') {
      const { firstName, lastName, email, password } = body as {
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
      };
      if (!email || !firstName || !lastName) {
        return NextResponse.json(
          { success: false, error: 'First name, last name, and email required' },
          { status: 400 }
        );
      }
      const users = await getAllUsers();
      const emailLower = email.toString().toLowerCase().trim();
      if (users.some((u) => u.email.toLowerCase() === emailLower)) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
      const pwd = password && String(password).trim() ? String(password) : generatePassword(12);
      const newUser: UserRecord = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: `${String(firstName).trim()} ${String(lastName).trim()}`.trim(),
        email: emailLower,
        username: emailLower,
        password: pwd,
        role: 'user',
        widgets: normalizeWidgets({}),
        visibility_settings: {},
      };
      users.push(newUser);
      await saveAllUsers(users);
      return NextResponse.json({
        success: true,
        user: toPublicUser(newUser),
        generatedPassword: pwd,
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const users = await getAllUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = users[index];
    const newWidgets = widgets !== undefined ? normalizeWidgets(widgets) : user.widgets;
    const newVisibility = visibility_settings !== undefined ? visibility_settings : user.visibility_settings;

    if (user.role === 'admin') {
      const anyOn = newWidgets.managerTasks || newWidgets.specialistTasks || newWidgets.salesReport || newWidgets.callsByManager;
      if (!anyOn) {
        return NextResponse.json(
          { success: false, error: 'Admin must have at least one widget enabled' },
          { status: 400 }
        );
      }
    }

    users[index] = { ...user, widgets: newWidgets, visibility_settings: newVisibility ?? {} };
    await saveAllUsers(users);

    return NextResponse.json({ success: true, user: toPublicUser(users[index]) });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = getSessionUserFromCookie(cookieHeader);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }

    if (id === currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    const users = await getAllUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = users[index];
    const admins = users.filter((u) => u.role === 'admin');

    if (user.role === 'admin' && admins.length <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last admin' },
        { status: 400 }
      );
    }

    users.splice(index, 1);
    await saveAllUsers(users);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
