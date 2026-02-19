import { supabase } from './supabase';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export function validateFileSize(size: number): void {
  if (size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.`);
  }
}

type AppDataRow = {
  key: string;
  data: unknown;
};

export async function readAppData<T>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('app_data')
    .select('data')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const value = data?.data as T | undefined | null;
  return value ?? null;
}

export async function writeAppData(key: string, payload: unknown): Promise<void> {
  const { error } = await supabase
    .from('app_data')
    .upsert({ key, data: payload }, { onConflict: 'key' });

  if (error) throw error;
}
