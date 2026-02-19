import type { Task, Contact } from './excelParser';
import {
  EMPLOYEE_MAP,
  getTodayDateOnly,
  isOverdue,
  isDueToday,
  getContactName,
  formatDueDate,
  getDateOnly,
} from './excelParser';
import { readAppData } from './db';

type TasksStorage = {
  tasks: Task[];
  metadata: { originalFileName: string; uploadedAt: number };
};

type ContactsStorage = {
  contacts: Contact[];
  metadata: { originalFileName: string; uploadedAt: number };
};

export async function getTasksMetadata(): Promise<{ uploadedAt: number }> {
  const data = await readAppData<TasksStorage>('tasks_last_upload.json');
  return { uploadedAt: data?.metadata?.uploadedAt ?? 0 };
}

async function loadTasksFromStorage(): Promise<{ tasks: Task[]; uploadedAt: number }> {
  const data = await readAppData<TasksStorage>('tasks_last_upload.json');
  if (!data || !Array.isArray(data.tasks)) {
    return { tasks: [], uploadedAt: 0 };
  }
  const tasks = data.tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate ? new Date(t.dueDate as unknown as string) : null,
  })) as Task[];
  return { tasks, uploadedAt: data.metadata?.uploadedAt ?? 0 };
}

async function loadContactsFromStorage(): Promise<{ contacts: Contact[]; uploadedAt: number }> {
  const data = await readAppData<ContactsStorage>('contacts_last_upload.json');
  if (!data || !Array.isArray(data.contacts)) {
    return { contacts: [], uploadedAt: 0 };
  }
  return { contacts: data.contacts, uploadedAt: data.metadata?.uploadedAt ?? 0 };
}

export async function initializeCache(): Promise<void> {
  // No-op; storage is read on demand
}

export type TaskMetrics = {
  openTasks: number;
  overdue: number;
  dueToday: number;
  oldestOverdue: number;
  completedYesterday: number;
};

export function calculateMetrics(tasks: Task[], employeeId: string | null = null): TaskMetrics {
  const today = getTodayDateOnly();
  let filteredTasks = tasks;
  if (employeeId) {
    filteredTasks = tasks.filter((t) => t.assignedTo === employeeId);
  }

  const openTasks = filteredTasks.filter((t) => !t.completed);
  const overdue = openTasks.filter((t) => isOverdue(t.dueDate, today));
  const dueToday = openTasks.filter((t) => isDueToday(t.dueDate, today));

  let oldestOverdue = 0;
  if (overdue.length > 0) {
    const todayDate = new Date(today + 'T00:00:00');
    const overdueDates = overdue
      .map((t) => t.dueDate)
      .filter((d): d is Date => d !== null)
      .map((d) => {
        const dueDateOnly = new Date(getDateOnly(d) + 'T00:00:00');
        const diffTime = todayDate.getTime() - dueDateOnly.getTime();
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return days >= 1 ? days : 1;
      });
    if (overdueDates.length > 0) oldestOverdue = Math.max(...overdueDates);
  }

  return {
    openTasks: openTasks.length,
    overdue: overdue.length,
    dueToday: dueToday.length,
    oldestOverdue,
    completedYesterday: 0,
  };
}

export type ManagerTaskRow = {
  userName: string;
  openTasks: number;
  overdue: number;
  dueToday: number;
  oldestOverdue: number;
  completedYesterday: number;
};

/** Проверка видимости: пустой/undefined = видеть всех; иначе только имена из списка (без учёта регистра). */
function isVisibleByNames(employeeName: string, visibleNames: string[] | null | undefined): boolean {
  if (!visibleNames || visibleNames.length === 0) return true;
  const lower = employeeName.toLowerCase();
  return visibleNames.some((n) => n.toLowerCase() === lower);
}

export async function getManagerTasksData(visibleNames?: string[] | null): Promise<{
  rows: ManagerTaskRow[];
  uploadedAt: number;
}> {
  const { tasks, uploadedAt } = await loadTasksFromStorage();

  const employeeIds = new Set<string>();
  tasks.forEach((t) => {
    if (t.assignedTo && EMPLOYEE_MAP[t.assignedTo]) employeeIds.add(t.assignedTo);
  });

  const rows: ManagerTaskRow[] = [];

  for (const employeeId of employeeIds) {
    const userName = EMPLOYEE_MAP[employeeId];
    if (!isVisibleByNames(userName, visibleNames)) continue;
    const metrics = calculateMetrics(tasks, employeeId);
    rows.push({ userName, ...metrics });
  }

  for (const [employeeId, employeeName] of Object.entries(EMPLOYEE_MAP)) {
    if (!employeeIds.has(employeeId) && isVisibleByNames(employeeName, visibleNames)) {
      rows.push({
        userName: employeeName,
        openTasks: 0,
        overdue: 0,
        dueToday: 0,
        oldestOverdue: 0,
        completedYesterday: 0,
      });
    }
  }

  rows.sort((a, b) => {
    const ao = a.overdue;
    const bo = b.overdue;
    if (ao !== bo) return bo - ao;
    return b.openTasks - a.openTasks;
  });

  return { rows, uploadedAt };
}

export type SpecialistTaskRow = {
  clientName: string;
  contactId: string;
  taskTitle: string;
  dueDate: string;
};

export async function getSpecialistTasksData(
  employeeName: string,
  filter: 'all' | 'overdue' | 'dueToday'
): Promise<SpecialistTaskRow[]> {
  const { tasks } = await loadTasksFromStorage();
  const { contacts } = await loadContactsFromStorage();
  const today = getTodayDateOnly();

  const employeeId = Object.entries(EMPLOYEE_MAP).find(
    ([_, name]) => name === employeeName
  )?.[0];

  if (!employeeId) return [];

  let filteredTasks = tasks.filter((t) => t.assignedTo === employeeId && !t.completed);
  if (filter === 'overdue') {
    filteredTasks = filteredTasks.filter((t) => isOverdue(t.dueDate, today));
  } else if (filter === 'dueToday') {
    filteredTasks = filteredTasks.filter((t) => isDueToday(t.dueDate, today));
  }

  filteredTasks.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  return filteredTasks.map((task) => ({
    clientName: getContactName(task.contactId, contacts),
    contactId: task.contactId,
    taskTitle: task.title,
    dueDate: formatDueDate(task.dueDate),
  }));
}

export async function getSpecialistTotals(employeeName: string): Promise<TaskMetrics> {
  const { tasks } = await loadTasksFromStorage();
  const employeeId = Object.entries(EMPLOYEE_MAP).find(
    ([_, name]) => name === employeeName
  )?.[0];

  if (!employeeId) {
    return {
      openTasks: 0,
      overdue: 0,
      dueToday: 0,
      oldestOverdue: 0,
      completedYesterday: 0,
    };
  }

  return calculateMetrics(tasks, employeeId);
}
