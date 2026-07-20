'use server';

import * as authService from '@/server/services/auth.service';

export async function getCurrentProfile() {
  return authService.getCurrentProfile();
}
