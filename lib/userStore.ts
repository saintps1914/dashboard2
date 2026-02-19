import { readAppData, writeAppData } from './db';

export type UserRole = 'admin' | 'user';

export type WidgetToggles = {
  managerTasks: boolean;
  specialistTasks: boolean;
  salesReport: boolean;
  callsByManager: boolean;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  widgets: WidgetToggles;
};

export type ApiUser = {
  id: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
};

const defaultWidgets: WidgetToggles = {
  managerTasks: true,
  specialistTasks: true,
  salesReport: true,
  callsByManager: true,
};

function ensureWidgetsShape(w: Record<string, unknown> | null | undefined): WidgetToggles {
  return {
    managerTasks: typeof w?.managerTasks === 'boolean' ? w.managerTasks : true,
    specialistTasks: typeof w?.specialistTasks === 'boolean' ? w.specialistTasks : true,
    salesReport: typeof w?.salesReport === 'boolean' ? w.salesReport : true,
    callsByManager: typeof (w as WidgetToggles)?.callsByManager === 'boolean' ? (w as WidgetToggles).callsByManager : true,
  };
}

type UsersStorage = { users: UserRecord[] };

async function readUsersData(): Promise<{ users: UserRecord[] }> {
  const data = await readAppData<UsersStorage>('users.json');
  if (data && Array.isArray(data.users) && data.users.length > 0) {
    return {
      users: data.users.map((u: UserRecord) => ({
        ...u,
        widgets: ensureWidgetsShape(u.widgets),
      })),
    };
  }
  const defaultData = {
    users: [
      {
        id: 'admin',
        name: 'Admin User',
        email: 'admin@test.com',
        username: 'admin@test.com',
        password: 'admin123',
        role: 'admin' as UserRole,
        widgets: defaultWidgets,
      },
    ],
  };
  await writeAppData('users.json', defaultData);
  return defaultData;
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const { users } = await readUsersData();
  return users;
}

export async function saveAllUsers(users: UserRecord[]): Promise<void> {
  await writeAppData('users.json', { users });
}

export function generatePassword(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export type PublicUser = Omit<UserRecord, 'password'>;

export function toPublicUser(user: UserRecord): PublicUser {
  const { password, ...rest } = user;
  return rest;
}
