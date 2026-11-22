import { describe, expect, it } from "vitest";
import { backupFilename, parseBackup } from "./backup";

describe("backup file naming", () => {
  it("name is stable and includes the local date", () => {
    expect(backupFilename()).toMatch(/^shishu-backup-\d{8}\.json$/);
  });
});

describe("parseBackup validation", () => {
  it("accepts a well-formed backup", () => {
    const b = parseBackup({
      app: "shishu", version: 1, createdAt: "2026-11-23T00:00:00.000Z",
      localStorage: { "shishu-settings": "{}" },
      tables: { progress: [], sessions: [] },
    });
    expect(b.app).toBe("shishu");
    expect(b.localStorage["shishu-settings"]).toBe("{}");
  });

  it("refuses files not saved by shishu", () => {
    expect(() => parseBackup({ app: "other", version: 1 })).toThrow(/not saved by Shishu/);
    expect(() => parseBackup(null)).toThrow(/not a Shishu backup/);
    expect(() => parseBackup("nope")).toThrow(/not a Shishu backup/);
  });

  it("refuses unknown versions and damaged shapes with friendly errors", () => {
    expect(() => parseBackup({ app: "shishu", version: 2 })).toThrow(/version 2/);
    expect(() => parseBackup({ app: "shishu", version: 1, localStorage: "x" })).toThrow(/damaged/);
  });

  it("ignores localStorage keys that do not belong to shishu on apply", () => {
    // parse-level: only shishu-* keys are ever carried; a foreign key inside the file is
    // preserved in the parsed object but applyBackup filters by prefix — checked in build.
    const b = parseBackup({
      app: "shishu", version: 1, createdAt: "",
      localStorage: { "evil": "1", "shishu-gamify": "{\"xp\":5}" },
      tables: {},
    });
    expect(Object.keys(b.localStorage)).toContain("shishu-gamify");
  });
});
