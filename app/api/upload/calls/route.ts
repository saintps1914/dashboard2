import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromCookie } from '@/lib/auth';
import {
  parseCallsCsv,
  aggregateCallsByManager,
  extractReportDateFromFilename,
} from '@/lib/callsParser';
import { readAppData, writeAppData, validateFileSize } from '@/lib/db';
import type { ManagerCallsAggregate } from '@/lib/callsParser';

type CallsReportEntry = {
  perManagerAggregates: ManagerCallsAggregate[];
  totalsAggregates: {
    totalCalls: number;
    answeredCalls: number;
    callsOver30Sec: number;
  };
  reportDate: string;
  originalFileName: string;
  uploadedAt: number;
};

type CallsReportsStorage = {
  callsReportsByDate: Record<string, CallsReportEntry>;
};

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const user = getSessionUserFromCookie(cookieHeader);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const ext = (file.name || '').toLowerCase().split('.').pop();
    if (ext !== 'csv') {
      return NextResponse.json({ success: false, error: 'Only .csv files allowed' }, { status: 400 });
    }

    validateFileSize(file.size);
    const text = await file.text();
    const calls = parseCallsCsv(text);
    const perManager = aggregateCallsByManager(calls);

    const reportDate = extractReportDateFromFilename(file.name) ?? new Date().toISOString().slice(0, 10);

    const totalsAggregates = {
      totalCalls: perManager.reduce((s, m) => s + m.totalCalls, 0),
      answeredCalls: perManager.reduce((s, m) => s + m.answeredCalls, 0),
      callsOver30Sec: perManager.reduce((s, m) => s + m.callsOver30Sec, 0),
    };

    const entry: CallsReportEntry = {
      perManagerAggregates: perManager,
      totalsAggregates,
      reportDate,
      originalFileName: file.name,
      uploadedAt: Date.now(),
    };

    const existing = (await readAppData<CallsReportsStorage>('calls_reports.json')) ?? {
      callsReportsByDate: {},
    };
    existing.callsReportsByDate[reportDate] = entry;
    await writeAppData('calls_reports.json', existing);

    return NextResponse.json({
      success: true,
      reportDate,
      metadata: { originalFileName: file.name, uploadedAt: entry.uploadedAt },
      perManager,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
