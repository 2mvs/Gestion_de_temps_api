const normalize = (value?: string | null): string => {
  return (value || '').toString().toUpperCase();
};

export const ADMIN_ROLES = ['ADMINISTRATEUR', 'ADMIN'];
export const MANAGER_ROLES = ['GESTIONNAIRE', 'MANAGER', 'MANGER'];
export const USER_ROLES = ['UTILISATEUR', 'USER'];

export const isAdminRole = (role?: string | null): boolean => {
  const normalized = normalize(role);
  return ADMIN_ROLES.includes(normalized);
};

export const isManagerRole = (role?: string | null): boolean => {
  const normalized = normalize(role);
  return MANAGER_ROLES.includes(normalized);
};

export const isUserRole = (role?: string | null): boolean => {
  const normalized = normalize(role);
  return USER_ROLES.includes(normalized);
};

const ROLE_SYNONYMS: Record<string, string[]> = {
  ADMINISTRATEUR: ADMIN_ROLES,
  ADMIN: ADMIN_ROLES,
  ADMINISTRATOR: ADMIN_ROLES,
  GESTIONNAIRE: MANAGER_ROLES,
  MANAGER: MANAGER_ROLES,
  MANGER: MANAGER_ROLES,
  UTILISATEUR: USER_ROLES,
  USER: USER_ROLES,
};

export const matchesAllowedRoles = (role: string | undefined, allowed: string[]): boolean => {
  if (!role) return false;
  const normalizedRole = normalize(role);
  const expandedAllowed = allowed
    .map(normalize)
    .flatMap((value) => ROLE_SYNONYMS[value] || [value]);
  return expandedAllowed.includes(normalizedRole);
};


