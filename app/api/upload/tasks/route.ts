import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromCookie } from '@/lib/auth';
import { parseTasksFromBuffer } from '@/lib/excelParser';
import { writeAppData, validateFileSize } from '@/lib/db';
import type { Task } from '@/lib/excelParser';

type TasksStorage = {
  tasks: Task[];
  metadata: {
    originalFileName: string;
    uploadedAt: number;
  };
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
    if (ext !== 'xlsx') {
      return NextResponse.json({ success: false, error: 'Only .xlsx files allowed' }, { status: 400 });
    }

    validateFileSize(file.size);
    const buffer = Buffer.from(await file.arrayBuffer());
    const tasks = parseTasksFromBuffer(buffer);

    const data: TasksStorage = {
      tasks,
      metadata: {
        originalFileName: file.name,
        uploadedAt: Date.now(),
      },
    };

    await writeAppData('tasks_last_upload.json', data);
    await writeAppData(`archive_tasks_${Date.now()}`, data);

    return NextResponse.json({
      success: true,
      count: tasks.length,
      metadata: data.metadata,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
