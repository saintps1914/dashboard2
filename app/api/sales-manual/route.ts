import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromCookie } from '@/lib/auth';
import { readAppData, writeAppData } from '@/lib/db';

const MARYNA_NAME = 'Maryna Shuliatytska';

export type ManualFieldValue = {
  value: string | number;
  updatedAt: number;
  updatedBy: string;
};

export type ManualByDate = {
  interestedClients?: ManualFieldValue;
  dealsClosed?: ManualFieldValue;
  totalContractAmount?: ManualFieldValue;
  firstPaymentAmount?: ManualFieldValue;
};

type SalesManualStorage = {
  manualByDate: Record<string, ManualByDate>;
};

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const user = getSessionUserFromCookie(cookieHeader);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const data = await readAppData<SalesManualStorage>('sales_manual.json');
    const manualByDate = data?.manualByDate ?? {};

    return NextResponse.json({ success: true, manualByDate });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const user = getSessionUserFromCookie(cookieHeader);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    if (user.name !== MARYNA_NAME) {
      return NextResponse.json(
        { success: false, error: 'Only Maryna Shuliatytska can edit manual fields' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reportDate, field, value } = body as {
      reportDate: string;
      field: 'interestedClients' | 'dealsClosed' | 'totalContractAmount' | 'firstPaymentAmount';
      value: string | number;
    };

    if (!reportDate || !field) {
      return NextResponse.json({ success: false, error: 'reportDate and field required' }, { status: 400 });
    }

    const data = (await readAppData<SalesManualStorage>('sales_manual.json')) ?? {
      manualByDate: {},
    };
    if (!data.manualByDate[reportDate]) {
      data.manualByDate[reportDate] = {};
    }

    const fv: ManualFieldValue = {
      value: typeof value === 'number' ? value : String(value ?? ''),
      updatedAt: Date.now(),
      updatedBy: user.name,
    };
    data.manualByDate[reportDate][field] = fv;

    await writeAppData('sales_manual.json', data);

    return NextResponse.json({ success: true, manualByDate: data.manualByDate });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
