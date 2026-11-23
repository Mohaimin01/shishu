import { describe, expect, it } from "vitest";
import {
  detectCloudProvider, makeCloudSnapshot, validateCloudSnapshot,
} from "./cloudSync";
import type { BackupFile } from "./backup";

const backup = (tables: BackupFile["tables"] = {}): BackupFile => ({
  app: "shishu",
  version: 1,
  createdAt: "2026-11-23T00:00:00.000Z",
  localStorage: { "shishu-gamify": "{}" },
  tables,
});

describe("detectCloudProvider", () => {
  it("on the web there is no platform sign-in — the answer is honest null", () => {
    // jsdom IS the web: Capacitor.getPlatform() === "web"
    expect(detectCloudProvider()).toBeNull();
  });
});

describe("makeCloudSnapshot", () => {
  it("strips family voice recordings — voices never leave the device", () => {
    const b = backup({
      progress: [{ id: "x", attempts: 1 }],
      familyaudio: [{ key: "c1:bn:water", blob: "AAAA", updatedAt: 1 }],
      sessions: [{ day: "2026-11-23", minutes: 5 }],
    });
    const snap = makeCloudSnapshot(b);
    expect(snap.audioStripped).toBe(true);
    expect(snap.tables.familyaudio).toBeUndefined();
    expect(snap.tables.progress).toEqual([{ id: "x", attempts: 1 }]);
    expect(snap.tables.sessions).toEqual([{ day: "2026-11-23", minutes: 5 }]);
    expect(snap.localStorage["shishu-gamify"]).toBe("{}");
  });

  it("a backup without recordings passes through unchanged (except the marker)", () => {
    const b = backup({ progress: [] });
    const snap = makeCloudSnapshot(b);
    expect(snap.tables).toEqual({ progress: [] });
  });
});

describe("validateCloudSnapshot", () => {
  it("accepts an honest snapshot", () => {
    const snap = makeCloudSnapshot(backup({ progress: [{ id: "x" }] }));
    expect(validateCloudSnapshot(snap).app).toBe("shishu");
  });

  it("refuses a snapshot that claims to carry family voices, with a loud reason", () => {
    const sneaky = { ...makeCloudSnapshot(backup()), tables: { familyaudio: [{ key: "x", blob: "AAAA" }] } };
    expect(() => validateCloudSnapshot(sneaky)).toThrow(/never travel|backup file/);
  });

  it("refuses files that are not Shishu backups at all", () => {
    expect(() => validateCloudSnapshot({ app: "other" })).toThrow(/not saved by Shishu/);
    expect(() => validateCloudSnapshot(null)).toThrow(/not a Shishu backup/);
  });
});
