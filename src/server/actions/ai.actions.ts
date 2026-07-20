'use server';

import * as aiService from '@/server/services/ai.service';

export async function extractSummary(content: string) {
  return aiService.extractSummary(content);
}
