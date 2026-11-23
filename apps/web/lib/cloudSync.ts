"use client";

// Cloud sync, the privacy-first way: progress can travel through the platform sign-in
// the device already trusts (Google Play Games on Android, Game Center on iOS) — never
// through a Shishu server. The snapshot is a backup file MINUS the family voice
// recordings: voices never leave the device, not even inside a snapshot.
//
// The native plugins are not bundled yet (they need a Capacitor version match — see
// docs/PLAY-STORE.md §6), so on web and until the plugins ship, every call reports
// honestly and the UI points to the backup file instead. No pretending.

import { Capacitor } from "@capacitor/core";
import { parseBackup, type BackupFile } from "./backup";

export type CloudProvider = "google-play-games" | "game-center";

export type CloudUser = { id: string; displayName: string };

export type CloudSnapshot = BackupFile & {
  /** marks that family audio has been stripped (voices never travel) */
  audioStripped: true;
};

const PROVIDER_PLUGIN: Record<CloudProvider, string> = {
  "google-play-games": "GooglePlayGames",
  "game-center": "GameCenter",
};

/** Which platform sign-in is available right now, if any (runtime detection, no import). */
export function detectCloudProvider(): CloudProvider | null {
  if (Capacitor.getPlatform() === "web") return null;
  const plugins = (Capacitor as unknown as { Plugins?: Record<string, unknown> }).Plugins ?? {};
  if (plugins[PROVIDER_PLUGIN["google-play-games"]]) return "google-play-games";
  if (plugins[PROVIDER_PLUGIN["game-center"]]) return "game-center";
  return null;
}

/** Backup file → cloud snapshot: strips family voice recordings (they never leave the device). */
export function makeCloudSnapshot(b: BackupFile): CloudSnapshot {
  const { familyaudio, ...tables } = b.tables ?? {};
  void familyaudio;
  return { ...b, tables, audioStripped: true };
}

/** Restore-time check: a snapshot that claims to carry family voices is refused, loudly. */
export function validateCloudSnapshot(data: unknown): BackupFile {
  const b = parseBackup(data);
  const audio = b.tables?.familyaudio;
  if (Array.isArray(audio) && audio.length > 0) {
    throw new Error(
      "This snapshot carries family voice recordings — those never travel through cloud save. " +
      "Nothing was restored; use the backup file instead.",
    );
  }
  return b;
}

function pluginFor(provider: CloudProvider): { name: string; plugin: Record<string, (...a: unknown[]) => unknown> } | null {
  const plugins = (Capacitor as unknown as { Plugins?: Record<string, Record<string, (...a: unknown[]) => unknown>> }).Plugins ?? {};
  const name = PROVIDER_PLUGIN[provider];
  const plugin = plugins[name];
  return plugin ? { name, plugin } : null;
}

async function callPlugin(provider: CloudProvider, method: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const hit = pluginFor(provider);
  if (!hit) {
    throw new Error("Cloud save is not available on this device yet — use the backup file below.");
  }
  return hit.plugin[method]?.(args);
}

export async function cloudSignIn(provider: CloudProvider): Promise<CloudUser> {
  const res = (await callPlugin(provider, "signIn")) as Partial<CloudUser> | undefined;
  if (!res?.id) throw new Error("Sign-in was cancelled — nothing was saved or restored.");
  return { id: res.id, displayName: res.displayName ?? "player" };
}

/** Saves the snapshot under the player's cloud save slot. Returns the slot id. */
export async function cloudSave(provider: CloudProvider, user: CloudUser, snapshot: CloudSnapshot): Promise<string> {
  const res = (await callPlugin(provider, "save", { playerId: user.id, data: JSON.stringify(snapshot) })) as { slot?: string } | undefined;
  return res?.slot ?? `${user.id}:latest`;
}

export async function cloudLoad(provider: CloudProvider, user: CloudUser): Promise<CloudSnapshot> {
  const res = (await callPlugin(provider, "load", { playerId: user.id })) as { data?: string } | undefined;
  if (!res?.data) throw new Error("No cloud save found for this player yet.");
  return validateCloudSnapshot(JSON.parse(res.data)) as CloudSnapshot;
}

export async function cloudSignOut(provider: CloudProvider): Promise<void> {
  await callPlugin(provider, "signOut");
}

export const PROVIDER_LABEL: Record<CloudProvider, string> = {
  "google-play-games": "Google Play Games",
  "game-center": "Game Center",
};
