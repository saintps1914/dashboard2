import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromCookie } from '@/lib/auth';
import { EMPLOYEE_MAP } from '@/lib/excelParser';
import { readAppData } from '@/lib/db';

type CallsReportEntry = { perManagerAggregates: { managerName: string }[] };
type CallsReportsStorage = { callsReportsByDate: Record<string, CallsReportEntry> };

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = getSessionUserFromCookie(cookieHeader);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
  }

  const employeeNames = Object.values(EMPLOYEE_MAP);

  const callsData = await readAppData<CallsReportsStorage>('calls_reports.json');
  const reports = callsData?.callsReportsByDate && typeof callsData.callsReportsByDate === 'object'
    ? callsData.callsReportsByDate
    : {};
  const managerNamesSet = new Set<string>();
  for (const entry of Object.values(reports)) {
    if (entry?.perManagerAggregates && Array.isArray(entry.perManagerAggregates)) {
      for (const m of entry.perManagerAggregates) {
        if (m?.managerName) managerNamesSet.add(m.managerName);
      }
    }
  }
  const callsByManagerNames = Array.from(managerNamesSet).sort();

  return NextResponse.json({
    success: true,
    managerTasks: employeeNames,
    specialistTasks: employeeNames,
    salesReport: callsByManagerNames,
    callsByManager: callsByManagerNames,
  });
}
