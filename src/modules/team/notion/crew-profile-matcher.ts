import type { ParsedCrewProfilePage } from './parsers/crew-profile-page.parser';

const accountKey = (value: string) => value.replace(/-/g, '').trim().toLowerCase();
const emailKey = (value: string) => value.trim().toLowerCase();

/** Match identities, not names: duplicate or conflicting identities fail closed. */
export class CrewProfileMatcher {
  private readonly byAccount = new Map<string, Set<ParsedCrewProfilePage>>();
  private readonly byEmail = new Map<string, Set<ParsedCrewProfilePage>>();

  constructor(profiles: ParsedCrewProfilePage[]) {
    for (const profile of profiles) {
      for (const id of profile.personIds) this.add(this.byAccount, accountKey(id), profile);
      if (profile.email) this.add(this.byEmail, emailKey(profile.email), profile);
    }
  }

  resolve(accountIds: string[], email: string | null): ParsedCrewProfilePage | undefined {
    const accounts = accountIds.map(accountKey).filter(Boolean);
    const matches = new Set(accounts.flatMap((id) => [...(this.byAccount.get(id) ?? [])]));
    if (matches.size > 0) return matches.size === 1 ? [...matches][0] : undefined;
    if (!email) return undefined;
    const emailMatches = this.byEmail.get(emailKey(email));
    if (emailMatches?.size !== 1) return undefined;
    const profile = [...emailMatches][0];
    // An email must not override two explicitly different Notion user identities.
    if (accounts.length && profile.personIds.some((id) => accountKey(id))) return undefined;
    return profile;
  }

  private add(
    index: Map<string, Set<ParsedCrewProfilePage>>,
    key: string,
    profile: ParsedCrewProfilePage,
  ) {
    if (!key) return;
    const profiles = index.get(key) ?? new Set<ParsedCrewProfilePage>();
    profiles.add(profile);
    index.set(key, profiles);
  }
}
