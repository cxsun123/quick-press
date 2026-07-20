'use server';

import { decrypt } from '@/server/utils/crypto';

export async function decryptPassword(encrypted: string): Promise<string> {
  try {
    return decrypt(encrypted);
  } catch {
    return '';
  }
}
