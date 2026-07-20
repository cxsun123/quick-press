import { createClient } from '@/server/db/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from('themes').select('url').eq('is_active', true).single();
  return NextResponse.json({ url: data?.url || null });
}
