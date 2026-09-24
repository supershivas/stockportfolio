// Types de src/app-update.js (copie du design system, module JS sans types).
export type ChangelogEntry = { version: string; date: string; changes: string[] }
export function isBusyDefault(): boolean
export function startUpdateCheck(options?: {
  versionUrl?: string
  isBusy?: () => boolean
  onUpdated?: (version: string) => void
}): void
export function loadVersion(versionUrl?: string): Promise<string | null>
export function loadChangelog(changelogUrl?: string, count?: number): Promise<ChangelogEntry[]>
export function downloadJSON(data: unknown, filename: string): void
