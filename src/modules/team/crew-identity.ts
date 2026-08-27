export function resolveCrewIdentity<T extends { name: string; email?: string | null; joinedGen?: number | null;
  adminProfile?: { nameOverride?: string | null; emailOverride?: string | null; joinedGenOverride?: number | null } | null }>(crew: T): T {
  return { ...crew, name: crew.adminProfile?.nameOverride ?? crew.name,
    email: crew.adminProfile?.emailOverride ?? crew.email,
    joinedGen: crew.adminProfile?.joinedGenOverride ?? crew.joinedGen };
}
