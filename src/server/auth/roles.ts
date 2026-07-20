export type Role = 'admin' | 'editor' | 'author' | 'subscriber';

const ROLE_HIERARCHY: Record<Role, number> = {
  subscriber: 0,
  author: 1,
  editor: 2,
  admin: 3,
};

export function hasRole(userRole: Role | null | undefined, required: Role): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export function canManageContent(userRole: Role | null | undefined): boolean {
  return hasRole(userRole, 'editor');
}

export function canManageUsers(userRole: Role | null | undefined): boolean {
  return hasRole(userRole, 'admin');
}
