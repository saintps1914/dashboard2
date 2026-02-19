import * as XLSX from 'xlsx';

// Employee ID to Name mapping (fixed dictionary)
export const EMPLOYEE_MAP: Record<string, string> = {
  '7w1tVfTrwJ5Gh4UDtmbP': 'Nataliia Regush',
  'DSvZfxgURrWOpN210VZK': 'Olga Meshcheryakova',
  'nskWsdleZDj7fVCdMdzm': 'Arslan Utiaganov',
  'gDfAF8xgSm0EE6rn6V0a': 'Dmitrii Kabanov',
  'U72PGP8Yo6fWxEz8CpsA': 'Kristina Troinova',
  'kVQY2jyVcRBgYorv2DcC': 'Ruanna Ordukhanova-Aslanyan',
  'sEn4126azLP2UXaiCFhL': 'Maryna Urvantseva',
  '50ipYol5S8SLE63rsWNW': 'Nataliia Grek',
  '9fIAvzmbpsLLgtZMf9HU': 'Anastasiia Lopatina',
  'cTo7q67AJC5D5UL124BM': 'Vadim Kozorezov',
  'Wqmu11dCoFUrG7dqijkK': 'Lyudmila Sydachenko',
  'CP6EdbZAge4nV9ZYF2w2': 'Arina Alekhina',
  'gdJYO1ckf7W2RHvUZTva': 'Ihor Syrovatka',
  'BpOd8tLfllgxTyKlE6Gi': 'Anton Zhidkov',
  'vwv62G0Cpno3rTP5rFun': 'Julia Krendeleva',
  'Qu7TtmFUglRCrxfQcqtA': 'Alina Yavlovskaya',
  'bzdoFncppWiMsCf7ViP0': 'Danil Khudyakov',
  '09cHmkUuMWaWhrUQJOiv': 'Eugene Kuzmenko',
  '8po6dSPwbWCuNtLGgXHD': 'Vladimir Kryshtal',
  't5oriqTjOYO2QjMyhiIM': 'Heorhii Shepliakov',
  'uSnnR3bvud4VlTcwKJLk': 'Ilya Baburin',
  'xx3vbV9GiIhoxVFYl1um': 'Ievgenii Kryvonos',
  'oqMez3W5ZrIZFQHp3asL': 'Vyacheslav Petryanin',
  'tV8TxEeD7kp7xivyRJDy': 'Ilyas Kabulov',
  'ti491IouqLuR8bmISznA': 'Yevhenii Mosieiev',
  'cfF9aCwubyXvBqwhgo5W': 'Anastasiia Martin',
  'JXMaixCZvTArQNE08EGk': 'Aleksandr Baranov',
};

export type Task = {
  taskId: string;
  title: string;
  assignedTo: string;
  dueDate: Date | null;
  completed: boolean;
  contactId: string;
};

export type Contact = {
  id: string;
  first_name: string;
  last_name: string;
};

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'истина' || lower === '1';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    try {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 86400000);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const isoDate = Date.parse(trimmed);
    if (!isNaN(isoDate)) return new Date(isoDate);
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

export function getDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateOnly(): string {
  const now = new Date();
  return getDateOnly(now);
}

export function isOverdue(dueDate: Date | null, today: string): boolean {
  if (!dueDate) return false;
  const dueDateOnly = getDateOnly(dueDate);
  return dueDateOnly < today;
}

export function isDueToday(dueDate: Date | null, today: string): boolean {
  if (!dueDate) return false;
  const dueDateOnly = getDateOnly(dueDate);
  return dueDateOnly === today;
}

/** Parse tasks from XLSX buffer (upload) */
export function parseTasksFromBuffer(buffer: Buffer): Task[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as unknown[][];

  if (data.length < 2) return [];

  const tasks: Task[] = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[] | undefined;
    if (!row || row.length < 7) continue;

    const title = String(row[1] ?? '').trim();
    const assignedTo = String(row[3] ?? '').trim();
    const dueDateRaw = row[4];
    const completedRaw = row[5];
    const contactId = String(row[6] ?? '').trim();

    if (!title || !assignedTo) continue;

    const dueDate = parseDate(dueDateRaw);
    const completed = normalizeBoolean(completedRaw);

    tasks.push({
      taskId: String(row[0] ?? ''),
      title,
      assignedTo,
      dueDate,
      completed,
      contactId,
    });
  }
  return tasks;
}

/** Parse contacts from XLSX buffer (upload) */
export function parseContactsFromBuffer(buffer: Buffer): Contact[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as unknown[][];

  if (data.length < 2) return [];

  const contacts: Contact[] = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[] | undefined;
    if (!row || row.length < 3) continue;

    const id = String(row[0] ?? '').trim();
    if (!id) continue;

    contacts.push({
      id,
      first_name: String(row[1] ?? '').trim(),
      last_name: String(row[2] ?? '').trim(),
    });
  }
  return contacts;
}

export function getContactName(contactId: string, contacts: Contact[]): string {
  const contact = contacts.find((c) => c.id === contactId);
  if (!contact) return `Unknown Contact (${contactId})`;
  const name = `${contact.first_name} ${contact.last_name}`.trim();
  return name || `Unknown Contact (${contactId})`;
}

export function formatDueDate(dueDate: Date | null): string {
  if (!dueDate) return '—';
  return getDateOnly(dueDate);
}
