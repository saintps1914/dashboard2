import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromCookie } from '@/lib/auth';
import {
  getManagerTasksData,
  getSpecialistTasksData,
  getSpecialistTotals,
  getTasksMetadata,
} from '@/lib/tasksCache';
import { EMPLOYEE_MAP } from '@/lib/excelParser';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const filter = searchParams.get('filter') as 'all' | 'overdue' | 'dueToday' | 'totals' | null;

    if (type === 'manager') {
      const { rows, uploadedAt } = await getManagerTasksData();
      return NextResponse.json({ success: true, data: rows, uploadedAt });
    }

    if (type === 'specialist') {
      const cookieHeader = request.headers.get('cookie');
      const sessionUser = getSessionUserFromCookie(cookieHeader);
      if (!sessionUser) {
        return NextResponse.json(
          { success: false, error: 'Not authenticated' },
          { status: 401 }
        );
      }

      const employeeName = sessionUser.name ?? '';
      const employeeId = Object.entries(EMPLOYEE_MAP).find(
        ([_, name]) => name === employeeName
      )?.[0];

      if (!employeeId) {
        return NextResponse.json({
          success: true,
          error: 'No tasks mapping for this user',
          data: null,
          uploadedAt: 0,
        });
      }

      if (filter === 'totals' || !filter) {
        const [totals, { uploadedAt }] = await Promise.all([
          getSpecialistTotals(employeeName),
          getTasksMetadata(),
        ]);
        return NextResponse.json({
          success: true,
          data: totals,
          type: 'totals',
          uploadedAt,
        });
      }

      const [tasks, { uploadedAt }] = await Promise.all([
        getSpecialistTasksData(employeeName, filter),
        getTasksMetadata(),
      ]);
      return NextResponse.json({
        success: true,
        data: tasks,
        type: 'tasks',
        uploadedAt,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type parameter' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
