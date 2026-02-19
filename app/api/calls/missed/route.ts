import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromCookie } from '@/lib/auth';
import { readAppData } from '@/lib/db';
import { getMissedCallsWithCallback } from '@/lib/callsParser';
import type { CallRowFull } from '@/lib/callsParser';

type CallsReportEntry = {
  rawRows?: CallRowFull[];
  perManagerAggregates?: { managerName: string }[];
  reportDate?: string;
};

type CallsReportsStorage = {
  callsReportsByDate: Record<string, CallsReportEntry>;
};

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const user = getSessionUserFromCookie(cookieHeader);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const data = await readAppData<CallsReportsStorage>('calls_reports.json');
    const reports =
      data?.callsReportsByDate && typeof data.callsReportsByDate === 'object'
        ? data.callsReportsByDate
        : {};
    const reportDates = Object.keys(reports).sort().reverse();
    const latestDate = reportDates[0];
    const latest = latestDate ? reports[latestDate] : null;

    const visibleNames = user.visibility_settings?.callsByManager;
    const filterByVisibility = (list: { managerName: string }[]) => {
      if (!visibleNames || visibleNames.length === 0) return list;
      const set = new Set(visibleNames.map((n) => n.toLowerCase()));
      return list.filter((m) => set.has(m.managerName.toLowerCase()));
    };

    const managerNames = latest?.perManagerAggregates
      ? filterByVisibility(latest.perManagerAggregates).map((m) => m.managerName)
      : [];

    const rawRows = latest?.rawRows ?? [];
    let missed = getMissedCallsWithCallback(rawRows);
    if (managerNames.length > 0) {
      const set = new Set(managerNames.map((n) => n.toLowerCase()));
      missed = missed.filter((m) => set.has(m.managerName.toLowerCase()));
    }

    const managerFilter = request.nextUrl.searchParams.get('manager');
    const missedFiltered =
      managerFilter && managerFilter.trim()
        ? missed.filter((m) => m.managerName.toLowerCase() === managerFilter.trim().toLowerCase())
        : missed;

    return NextResponse.json({
      success: true,
      missed: missedFiltered,
      managerNames,
      reportDate: latest?.reportDate ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
