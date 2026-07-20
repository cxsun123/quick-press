'use server';

import * as statsService from '@/server/services/stats.service';

export async function getDashboardStats() {
  return statsService.getDashboardStats();
}
