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
