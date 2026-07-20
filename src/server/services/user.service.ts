import 'server-only';
import { createClient } from '@/server/db/client';
import * as userRepo from '@/server/repositories/user.repository';
import { hasRole, canManageUsers, type Role } from '@/server/auth/roles';

export async function listUsers() {
  return userRepo.findAllUsers();
}

export async function updateUserRole(actorId: string, userId: string, role: string) {
  const actor = await userRepo.findUserById(actorId);
  if (!actor || !canManageUsers(actor.role as Role)) {
    throw new Error('无权限');
  }
  await userRepo.updateUserRole(userId, role);
}
