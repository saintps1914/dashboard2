import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromCookie } from '@/lib/auth';
import { readAppData } from '@/lib/db';

type CallsReportEntry = {
  totalsAggregates: {
    totalCalls: number;
    answeredCalls: number;
    callsOver30Sec: number;
  };
  perManagerAggregates?: { managerName: string; totalCalls: number; answeredCalls: number; callsOver30Sec: number }[];
  reportDate: string;
  uploadedAt: number;
};

type PerManagerItem = { managerName: string; totalCalls: number; answeredCalls: number; callsOver30Sec: number };

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
      data && typeof data === 'object' && data !== null && typeof data.callsReportsByDate === 'object' && data.callsReportsByDate !== null
        ? data.callsReportsByDate
        : {};
    const reportDates = Object.keys(reports).sort().reverse();
    const latestDate = reportDates[0];

    const visibleNames = user.visibility_settings?.callsByManager;
    const filterVisible = (list: { managerName: string }[]) => {
      if (!visibleNames || visibleNames.length === 0) return list;
      const set = new Set(visibleNames.map((n) => n.toLowerCase()));
      return list.filter((m) => set.has(m.managerName.toLowerCase()));
    };

    const sumFromEntry = (r: CallsReportEntry) => {
      const per: PerManagerItem[] = r.perManagerAggregates ?? [];
      const visible = filterVisible(per) as PerManagerItem[];
      return visible.reduce(
        (acc, m) => ({
          totalCalls: acc.totalCalls + m.totalCalls,
          answeredCalls: acc.answeredCalls + m.answeredCalls,
          callsOver30Sec: acc.callsOver30Sec + m.callsOver30Sec,
        }),
        { totalCalls: 0, answeredCalls: 0, callsOver30Sec: 0 }
      );
    };

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'today';

    if (period === 'today') {
      if (!latestDate || !reports[latestDate]) {
        return NextResponse.json({
          success: true,
          today: null,
          reportDate: null,
        });
      }
      const r = reports[latestDate];
      const sums = sumFromEntry(r);
      return NextResponse.json({
        success: true,
        today: {
          calls: sums.totalCalls,
          answered: sums.answeredCalls,
          conversations: sums.callsOver30Sec,
          uploadedAt: r.uploadedAt,
        },
        reportDate: r.reportDate,
      });
    }

    if (period === 'last7' || period === 'last30') {
      const windowSize = period === 'last7' ? 7 : 30;
      const latest = latestDate ? new Date(latestDate) : new Date();
      let totalCalls = 0;
      let totalAnswered = 0;
      let totalConversations = 0;
      let coveredDays = 0;

      for (let i = 0; i < windowSize; i++) {
        const d = new Date(latest);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const r = reports[key];
        if (r) {
          const sums = sumFromEntry(r);
          totalCalls += sums.totalCalls;
          totalAnswered += sums.answeredCalls;
          totalConversations += sums.callsOver30Sec;
          coveredDays += 1;
        }
      }

      return NextResponse.json({
        success: true,
        last7: period === 'last7',
        last30: period === 'last30',
        calls: totalCalls,
        answered: totalAnswered,
        conversations: totalConversations,
        coveredDays,
        windowSize,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid period' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
