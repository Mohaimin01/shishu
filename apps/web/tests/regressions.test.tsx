import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { buildRows, parseConceptsTsv, parseLexiconTsv, type LexiconLanguage } from "@shishu/core";

vi.mock("@/lib/progress", () => ({ recordGraded: vi.fn(async () => {}), recordExposure: vi.fn(async () => {}) }));
vi.mock("@/lib/audio", () => ({
  chime: vi.fn(), pop: vi.fn(), speak: vi.fn(() => true), speakOrPlay: vi.fn(() => true),
  canvasFontFamily: () => "sans-serif", fontsReady: async () => {},
}));
vi.mock("@/lib/db", () => ({ db: {}, addMinutes: vi.fn(), todayMinutes: vi.fn(async () => 0), localDay: () => "2026-01-01" }));

import SentenceStrip from "@/components/activities/SentenceStrip";
import WordTable from "@/components/words/WordTable";
import StudyMode from "@/components/words/StudyMode";

beforeEach(() => cleanup());

describe("Build the sentence (reported bug)", () => {
  const tileBtn = (w: string) => screen.getByRole("button", { name: `word tile ${w}` });

  it("the next sentence starts completely fresh after finishing the first", async () => {
    vi.useFakeTimers();
    const onAnswer = vi.fn();
    const { rerender } = render(<SentenceStrip key="a" lang="en" itemId="p-water-please" onAnswer={onAnswer} />);
    fireEvent.click(tileBtn("Water"));
    fireEvent.click(tileBtn("please"));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(onAnswer).toHaveBeenCalledTimes(1);

    // the play page now keys by card, but the component must be clean even WITHOUT a remount
    rerender(<SentenceStrip lang="en" itemId="p-i-eat-rice" onAnswer={onAnswer} />);
    const strip = screen.getByLabelText("sentence strip");
    expect(strip.textContent).toBe("▢▢▢"); // nothing placed
    expect(screen.getAllByRole("button", { name: /^word tile/ })).toHaveLength(3);
    expect(onAnswer).toHaveBeenCalledTimes(1); // not auto-completed
    vi.useRealTimers();
  });

  it("a wrong tap is not placed, and undo removes the last word", () => {
    render(<SentenceStrip lang="en" itemId="p-i-eat-rice" onAnswer={() => {}} />);
    fireEvent.click(tileBtn("rice")); // wrong: "I" is expected first
    expect(screen.getByLabelText("sentence strip").textContent).toBe("▢▢▢");
    fireEvent.click(tileBtn("I"));
    fireEvent.click(tileBtn("eat"));
    expect(screen.getByLabelText("sentence strip").textContent).toContain("I");
    fireEvent.click(screen.getByRole("button", { name: "undo the last word" }));
    expect(screen.getByLabelText("sentence strip").textContent).toBe("I▢▢");
    fireEvent.click(screen.getByRole("button", { name: "start the sentence over" }));
    expect(screen.getByLabelText("sentence strip").textContent).toBe("▢▢▢");
  });
});

describe("Word Rows UI with the real shipped data", () => {
  const dir = path.resolve(__dirname, "..", "..", "..", "content-packs", "lexicon");
  const metas = JSON.parse(fs.readFileSync(path.join(dir, "languages.json"), "utf8"));
  const { concepts } = parseConceptsTsv(fs.readFileSync(path.join(dir, "concepts.tsv"), "utf8"));
  const langs: Record<string, LexiconLanguage> = {};
  for (const m of metas) langs[m.code] = parseLexiconTsv(m, fs.readFileSync(path.join(dir, `${m.code}.tsv`), "utf8")).lang;
  const byCode = Object.fromEntries(metas.map((m: { code: string }) => [m.code, m]));

  it("renders the learner's table: native first, synonyms grouped, words in readable letters", () => {
    const rows = buildRows(concepts, langs, { native: "bn", targets: ["en", "hi"], readable: ["bengali"], limit: 30 });
    render(<WordTable rows={rows} metas={byCode} readable={["bengali"]} showRoman known={new Set()} onToggleKnown={() => {}} />);
    const heads = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(heads[1]).toContain("বাংলা");
    expect(heads[2]).toContain("English");
    const water = screen.getByText("ওয়াটার").closest("tr")!;
    expect(water.textContent).toContain("পানি");
    expect(water.textContent).toContain("বারি");
    expect(water.textContent).toContain("জল");
  });

  it("study cards: reveal, mark known, finish", () => {
    const rows = buildRows(concepts, langs, { native: "en", targets: ["bn"], readable: ["latin"] });
    const known = new Set<string>();
    const onKnown = vi.fn((id: string) => known.add(id));
    render(<StudyMode rows={rows} metas={byCode} readable={["latin"]} showRoman known={known} rowsPerDay={2} onPerDay={() => {}} onKnown={onKnown} />);
    fireEvent.click(screen.getByText("Show the other languages"));
    fireEvent.click(screen.getByText("I know it ✓"));
    fireEvent.click(screen.getByText("Show the other languages"));
    fireEvent.click(screen.getByText("I know it ✓"));
    expect(onKnown).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Today's rows are done!")).toBeTruthy();
  });
});
