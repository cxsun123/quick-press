import { createClient } from '@/server/db/client';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
