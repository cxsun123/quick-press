'use server';

import { createClient } from '@/server/db/client';
import { revalidatePath } from 'next/cache';
import * as userService from '@/server/services/user.service';

export async function listUsers() {
  return userService.listUsers();
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('NOT_AUTHENTICATED');
  await userService.updateUserRole(user.id, userId, role);
  revalidatePath('/admin/users');
}
