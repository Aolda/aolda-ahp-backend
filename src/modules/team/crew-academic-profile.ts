/** Return only an admission year, never a full student ID. */
export function normalizeAdmissionYear(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim().replace(/\s*(?:학번|년)$/, '').trim();
  if (/^\d{2}$/.test(text)) return text === '00' ? null : text;
  if (/^(?:19|20)\d{2}(?:\d{5})?$/.test(text)) return text.slice(0, 4);
  return null;
}

export interface CrewAcademicProfile {
  univDepartment?: string | null;
  univJoinedYear?: string | null;
  adminProfile?: {
    univDepartmentOverride?: string | null;
    univJoinedYearOverride?: string | null;
  } | null;
}

export function resolveCrewAcademicProfile(crew: CrewAcademicProfile) {
  return {
    univDepartment:
      crew.adminProfile?.univDepartmentOverride?.trim() || crew.univDepartment?.trim() || '',
    univJoinedYear:
      normalizeAdmissionYear(crew.adminProfile?.univJoinedYearOverride) ??
      normalizeAdmissionYear(crew.univJoinedYear) ?? '',
  };
}
