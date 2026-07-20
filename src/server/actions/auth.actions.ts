'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as authService from '@/server/services/auth.service';

export async function login(formData: FormData): Promise<void> {
  const result = await authService.login(
    formData.get('email') as string,
    formData.get('password') as string,
  );
  if (result.error) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function register(formData: FormData): Promise<void> {
  const result = await authService.register(
    formData.get('email') as string,
    formData.get('password') as string,
    formData.get('name') as string,
  );
  if (result.error) {
    redirect(`/register?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function logout(): Promise<void> {
  await authService.logout();
  revalidatePath('/', 'layout');
  redirect('/login');
}
