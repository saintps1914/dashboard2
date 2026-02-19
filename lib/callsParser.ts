import Papa from 'papaparse';

/** Parse Duration "MM:SS" or "HH:MM:SS" to total seconds */
export function parseDurationToSeconds(value: string | undefined): number {
  if (!value || typeof value !== 'string') return 0;
  const s = value.trim();
  if (!s) return 0;

  const parts = s.split(':').map((p) => parseInt(p, 10));
  if (parts.some((n) => isNaN(n))) return 0;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export type CallRow = {
  numberName: string;
  durationSeconds: number;
  callStatus: string;
};

/** Полная строка для вкладки «Пропущенные звонки» */
export type CallRowFull = {
  numberName: string;
  durationSeconds: number;
  callStatus: string;
  direction: string;
  contactName: string;
  contactPhone: string;
  dateTime: string;
  dateTimeSort: number;
};

export type MissedCallRow = {
  managerName: string;
  contactName: string;
  dateTime: string;
  status: string;
  calledBack: boolean;
};

export type ManagerCallsAggregate = {
  managerName: string;
  totalCalls: number;
  answeredCalls: number;
  callsOver30Sec: number;
};

export function parseCallsCsv(csvText: string): CallRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: CallRow[] = [];

  for (const row of result.data) {
    const numberName = (row['Number Name'] ?? row['number name'] ?? '').trim();
    const durationStr = row['Duration'] ?? row['duration'] ?? '';
    const callStatus = (row['Call Status'] ?? row['call status'] ?? '').trim();

    if (!numberName) continue;

    const durationSeconds = parseDurationToSeconds(durationStr);

    rows.push({
      numberName,
      durationSeconds,
      callStatus,
    });
  }

  return rows;
}

/** Парсит полные строки CSV для пропущенных звонков */
export function parseCallsCsvFull(csvText: string): CallRowFull[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: CallRowFull[] = [];
  for (const row of result.data) {
    const numberName = (row['Number Name'] ?? row['number name'] ?? '').trim();
    const durationStr = row['Duration'] ?? row['duration'] ?? '';
    const callStatus = (row['Call Status'] ?? row['call status'] ?? '').trim();
    const direction = (row['Direction'] ?? row['direction'] ?? '').trim().toLowerCase();
    const contactName = (row['Contact Name'] ?? row['contact name'] ?? '').trim();
    const contactPhone = (row['Contact Phone'] ?? row['contact phone'] ?? '').trim();
    const dateTimeStr = (row['Date & Time'] ?? row['date & time'] ?? row['Date and Time'] ?? '').trim();

    if (!numberName) continue;

    const durationSeconds = parseDurationToSeconds(durationStr);
    const dateTimeSort = dateTimeStr ? new Date(dateTimeStr).getTime() : 0;

    rows.push({
      numberName,
      durationSeconds,
      callStatus,
      direction,
      contactName,
      contactPhone,
      dateTime: dateTimeStr || '—',
      dateTimeSort: isNaN(dateTimeSort) ? 0 : dateTimeSort,
    });
  }
  return rows;
}

/** Пропущенные входящие и флаг «Перезвонили» */
export function getMissedCallsWithCallback(rows: CallRowFull[]): MissedCallRow[] {
  const missed = rows.filter(
    (r) => r.callStatus.toLowerCase() === 'missed' && r.direction === 'inbound'
  );
  const byPhone = new Map<string, { dateTimeSort: number }[]>();
  for (const r of rows) {
    if (!r.contactPhone) continue;
    const list = byPhone.get(r.contactPhone) ?? [];
    list.push({ dateTimeSort: r.dateTimeSort });
    byPhone.set(r.contactPhone, list);
  }
  const outboundByPhone = rows
    .filter((r) => r.direction === 'outbound' && r.contactPhone)
    .slice()
    .sort((a, b) => a.dateTimeSort - b.dateTimeSort);

  return missed.map((m) => {
    const outboundSame = outboundByPhone.filter(
      (o) => o.contactPhone === m.contactPhone && o.dateTimeSort > m.dateTimeSort
    );
    const calledBack = outboundSame.length > 0;
    return {
      managerName: m.numberName,
      contactName: m.contactName || m.contactPhone || '—',
      dateTime: m.dateTime,
      status: m.callStatus,
      calledBack,
    };
  });
}

/** Extract reportDate from filename like call-reporting-2026-02-18_19-40-06.csv */
export function extractReportDateFromFilename(filename: string): string | null {
  const match = filename.match(/call-reporting-(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/** Aggregate calls by manager */
export function aggregateCallsByManager(calls: CallRow[]): ManagerCallsAggregate[] {
  const byManager = new Map<string, { total: number; answered: number; over30: number }>();

  for (const row of calls) {
    const existing = byManager.get(row.numberName) ?? { total: 0, answered: 0, over30: 0 };
    existing.total += 1;
    if (row.callStatus === 'Answered') existing.answered += 1;
    if (row.durationSeconds > 30) existing.over30 += 1;
    byManager.set(row.numberName, existing);
  }

  return Array.from(byManager.entries())
    .map(([managerName, agg]) => ({
      managerName,
      totalCalls: agg.total,
      answeredCalls: agg.answered,
      callsOver30Sec: agg.over30,
    }))
    .sort((a, b) => b.totalCalls - a.totalCalls);
}
