import Cookies from 'js-cookie';
import type { WidgetToggles, PublicUser } from '@/lib/userStore';

const SESSION_COOKIE = 'dashboard_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export type SessionUser = PublicUser & {
  widgets: WidgetToggles;
};

type SessionPayload = SessionUser & {
  timestamp: number;
};

export function setSession(user: SessionUser): void {
  const payload: SessionPayload = {
    ...user,
    timestamp: Date.now(),
  };
  Cookies.set(SESSION_COOKIE, JSON.stringify(payload), {
    expires: 1,
    sameSite: 'strict',
  });
}

export function logout(): void {
  Cookies.remove(SESSION_COOKIE);
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const session = Cookies.get(SESSION_COOKIE);
  if (!session) return null;
  try {
    const data = JSON.parse(session) as SessionPayload;
    const now = Date.now();
    if (now - data.timestamp > SESSION_DURATION) {
      Cookies.remove(SESSION_COOKIE);
      return null;
    }
    const { timestamp, ...user } = data;
    return user;
  } catch {
    Cookies.remove(SESSION_COOKIE);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSessionUser() !== null;
}

export function getSessionEmail(): string | null {
  return getSessionUser()?.email ?? null;
}

export function getSessionRole(): 'admin' | 'user' {
  return getSessionUser()?.role ?? 'user';
}

export function getSessionWidgets(): WidgetToggles | null {
  return getSessionUser()?.widgets ?? null;
}

export function getSessionUserFromCookie(cookieHeader: string | null): SessionUser | null {
  if (!cookieHeader) return null;
  try {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);

    const session = cookies[SESSION_COOKIE];
    if (!session) return null;

    const data = JSON.parse(session) as SessionPayload;
    const now = Date.now();
    if (now - data.timestamp > SESSION_DURATION) return null;

    const { timestamp, ...user } = data;
    return user;
  } catch {
    return null;
  }
}
