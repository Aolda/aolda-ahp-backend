import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';

export const CSV_COLUMNS = ['crewId', 'name', 'email', 'joinedGen', 'univDepartment', 'univJoinedYear', 'description', 'isVisible', 'notionPageId'] as const;
export const CSV_TEMPLATE = '\uFEFF' + CSV_COLUMNS.join(',') + '\r\n';
export const CSV_MAX_BYTES = 512 * 1024;
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
export type ImportMode = 'create' | 'update';
type Row = Partial<Record<typeof CSV_COLUMNS[number], string>>;
export type ExistingCrew = {
  id: string; name: string; email: string | null; primaryNotionPageId: string | null;
  updatedAt: Date; sourceArchived: boolean;
  adminProfile: { emailOverride: string | null; updatedAt: Date } | null;
  termTeamSources?: Array<{ notionPageId: string }>;
};
export type PlannedRow = { row: number; values: Row; targetId?: string; errors: string[] };

// RFC 4180-style quoting, CRLF/LF and UTF-8 BOM. Reject malformed records instead of guessing.
export function parseCrewCsv(csv: string): Row[] {
  if (typeof csv !== 'string' || Buffer.byteLength(csv, 'utf8') > CSV_MAX_BYTES) throw new Error('CSV는 UTF-8, 최대 512KB여야 합니다.');
  if (csv.includes('\uFFFD') || csv.includes('\0')) throw new Error('UTF-8 CSV로 저장해 주세요.');
  const text = csv.replace(/^\uFEFF/, '');
  const records: string[][] = [];
  let record: string[] = [], cell = '', quoted = false, closed = false;
  const endCell = () => { record.push(cell.trim()); cell = ''; closed = false; };
  const endRecord = () => { endCell(); if (record.some(Boolean)) records.push(record); record = []; };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else cell += char;
    } else if (char === ',') endCell();
    else if (char === '\r' || char === '\n') { if (char === '\r' && text[i + 1] === '\n') i++; endRecord(); }
    else if (char === '"' && !cell && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error('CSV 따옴표 형식이 올바르지 않습니다.');
      cell += char;
    }
  }
  if (quoted) throw new Error('닫히지 않은 CSV 따옴표가 있습니다.');
  if (cell || closed || record.length) endRecord();
  const header = records.shift();
  if (!header || new Set(header).size !== header.length || header.some((x) => !(CSV_COLUMNS as readonly string[]).includes(x))) {
    throw new Error('CSV 양식의 열 이름을 사용해 주세요. 중복/알 수 없는 열은 허용하지 않습니다.');
  }
  if (!records.length || records.length > 1000) throw new Error('한 번에 1~1000행을 업로드해 주세요.');
  return records.map((cells, index) => {
    if (cells.length !== header.length) throw new Error(`${index + 2}행의 열 수가 양식과 다릅니다.`);
    return Object.fromEntries(header.map((key, i) => [key, cells[i] || undefined]));
  });
}

export function planCrewImport(csv: string, mode: ImportMode, existing: ExistingCrew[]): PlannedRow[] {
  if (mode !== 'create' && mode !== 'update') throw new Error('등록 모드를 선택해 주세요.');
  const seenIds = new Set<string>(), seenEmails = new Set<string>(), seenPages = new Set<string>();
  return parseCrewCsv(csv).map((values, index) => {
    const errors: string[] = [];
    if (values.crewId) values.crewId = values.crewId.toLowerCase();
    if (values.email) values.email = values.email.toLowerCase();
    if (values.notionPageId) {
      const raw = values.notionPageId.replace(/-/g, '').toLowerCase();
      values.notionPageId = raw.length === 32 ? raw.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : raw;
    }
    const target = existing.find((x) => x.id === values.crewId);
    if (mode === 'create') {
      if (values.crewId) errors.push('신규 등록에는 crewId를 비워 주세요.');
      if (!values.name || !values.email) errors.push('신규 등록에는 이름과 이메일이 필요합니다.');
    } else {
      if (!values.crewId || !UUID.test(values.crewId) || !target || target.sourceArchived) errors.push('수정 대상의 유효한 crewId가 필요합니다.');
      if (values.crewId && seenIds.has(values.crewId)) errors.push('파일에 같은 크루가 중복되었습니다.');
    }
    if (values.crewId) seenIds.add(values.crewId);
    if (values.name && values.name.length > 100) errors.push('이름은 최대 100자입니다.');
    if (values.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254) errors.push('이메일 형식이 올바르지 않습니다.');
      if (seenEmails.has(values.email) || existing.some((x) => x.id !== target?.id && [x.email, x.adminProfile?.emailOverride].some((email) => email?.trim().toLowerCase() === values.email))) errors.push('이메일이 중복됩니다. 기존 크루는 crewId로 수정해 주세요.');
      seenEmails.add(values.email);
    }
    if (values.notionPageId) {
      if (!UUID.test(values.notionPageId)) errors.push('Notion 페이지 ID 형식이 올바르지 않습니다.');
      if (seenPages.has(values.notionPageId) || existing.some((x) => x.id !== target?.id && [x.primaryNotionPageId, ...(x.termTeamSources ?? []).map((term) => term.notionPageId)].some((page) => page?.replace(/-/g, '') === values.notionPageId!.replace(/-/g, '')))) errors.push('이미 연결된 Notion 페이지입니다.');
      if (target?.primaryNotionPageId && target.primaryNotionPageId.replace(/-/g, '') !== values.notionPageId.replace(/-/g, '')) errors.push('기존 Notion 연결은 CSV로 교체할 수 없습니다.');
      seenPages.add(values.notionPageId);
    }
    if (values.joinedGen && (!/^\d{1,3}$/.test(values.joinedGen) || Number(values.joinedGen) > 999)) errors.push('기수는 0~999 정수입니다.');
    // Deliberately reject full student IDs; neither preview nor storage contains them.
    if (values.univJoinedYear && !/^(19|20)\d{2}$/.test(values.univJoinedYear)) { errors.push('입학연도는 4자리 연도만 입력해 주세요. 전체 학번은 받지 않습니다.'); delete values.univJoinedYear; }
    if (values.univDepartment && values.univDepartment.length > 200) errors.push('학과는 최대 200자입니다.');
    if (values.description && values.description.length > 5000) errors.push('소개는 최대 5000자입니다.');
    if (values.isVisible && !['true', 'false'].includes(values.isVisible)) errors.push('공개 여부는 true 또는 false입니다.');
    return { row: index + 2, values, targetId: mode === 'update' ? target?.id : undefined, errors };
  });
}

export class CrewCsvImportService {
  constructor(private readonly prisma: PrismaClient, private readonly secret: string) {}

  private snapshot(db: Prisma.TransactionClient) {
    return db.crewSource.findMany({ orderBy: { id: 'asc' }, select: {
      id: true, name: true, email: true, primaryNotionPageId: true, updatedAt: true, sourceArchived: true,
      adminProfile: { select: { emailOverride: true, updatedAt: true } },
      termTeamSources: { select: { notionPageId: true }, orderBy: { notionPageId: 'asc' } },
    } });
  }

  private signature(csv: string, mode: ImportMode, actor: string, expires: number, existing: ExistingCrew[]) {
    return createHmac('sha256', this.secret).update(JSON.stringify({ csv, mode, actor, expires, existing })).digest('hex');
  }

  async preview(csv: string, mode: ImportMode, actor: string) {
    const existing = await this.snapshot(this.prisma);
    const rows = planCrewImport(csv, mode, existing);
    const expires = Date.now() + 15 * 60_000;
    return { rows, mode, valid: rows.every((x) => !x.errors.length),
      token: rows.some((x) => x.errors.length) ? null : `${expires}.${this.signature(csv, mode, actor, expires, existing)}` };
  }

  async commit(csv: string, mode: ImportMode, actor: string, token: string) {
    if (typeof token !== 'string' || !/^\d{13}\.[\da-f]{64}$/.test(token)) throw new Error('미리보기를 먼저 확인해 주세요.');
    const [expiration, signature] = token.split('.');
    const expires = Number(expiration);
    if (Date.now() > expires) throw new Error('미리보기가 만료되었습니다. 다시 확인해 주세요.');
    return this.prisma.$transaction(async (tx) => {
      // Serializes imports; Serializable also detects overlapping Notion/admin writes.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(7342101)`;
      const existing = await this.snapshot(tx);
      const expected = this.signature(csv, mode, actor, expires, existing);
      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('CSV 또는 크루 정보가 변경되었습니다. 미리보기를 다시 확인해 주세요.');
      const rows = planCrewImport(csv, mode, existing);
      if (rows.some((x) => x.errors.length)) throw new Error('CSV 검증 오류가 있습니다.');
      for (const { values: v, targetId } of rows) {
        const overrides = {
          nameOverride: v.name, emailOverride: v.email,
          joinedGenOverride: v.joinedGen === undefined ? undefined : Number(v.joinedGen),
          univDepartmentOverride: v.univDepartment, univJoinedYearOverride: v.univJoinedYear,
          description: v.description, isVisible: v.isVisible === undefined ? undefined : v.isVisible === 'true',
        };
        if (targetId) {
          await tx.crewSource.update({ where: { id: targetId }, data: {
            primaryNotionPageId: v.notionPageId,
            adminProfile: { upsert: { create: overrides, update: overrides } },
          } });
        } else {
          await tx.crewSource.create({ data: {
            sourceKey: `csv:${randomUUID()}`, name: v.name!, email: v.email!,
            joinedGen: v.joinedGen === undefined ? null : Number(v.joinedGen),
            primaryNotionPageId: v.notionPageId, lastSyncedAt: new Date(),
            adminProfile: { create: { ...overrides, isVisible: overrides.isVisible ?? false } },
          } });
        }
      }
      return { created: mode === 'create' ? rows.length : 0, updated: mode === 'update' ? rows.length : 0 };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 });
  }
}
