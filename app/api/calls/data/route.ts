import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromCookie } from '@/lib/auth';
import { readAppData } from '@/lib/db';
import type { ManagerCallsAggregate } from '@/lib/callsParser';

type CallsReportEntry = {
  perManagerAggregates: ManagerCallsAggregate[];
  reportDate: string;
  originalFileName: string;
  uploadedAt: number;
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
    const reports = data?.callsReportsByDate ?? {};
    const reportDates = Object.keys(reports).sort().reverse();
    const latestDate = reportDates[0];
    const latest = latestDate ? reports[latestDate] : null;

    return NextResponse.json({
      success: true,
      latest: latest
        ? {
            reportDate: latest.reportDate,
            uploadedAt: latest.uploadedAt,
            perManager: latest.perManagerAggregates,
          }
        : null,
      allDates: reportDates,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
