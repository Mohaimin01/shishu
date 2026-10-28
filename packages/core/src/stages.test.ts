import { describe, it, expect } from "vitest";
import { stageForAge, nextStage, STAGE_ORDER } from "./stages";

describe("stageForAge", () => {
  it("maps ages to stages", () => {
    expect(stageForAge(2)).toBe("toddler");
    expect(stageForAge(3)).toBe("preschool");
    expect(stageForAge(4)).toBe("prek");
    expect(stageForAge(5)).toBe("k1");
    expect(stageForAge(7)).toBe("junior");
    expect(stageForAge(10)).toBe("tween");
  });
});

describe("nextStage", () => {
  it("returns next stage", () => {
    expect(nextStage("toddler")).toBe("preschool");
    expect(nextStage("tween")).toBeNull();
  });
  it("STAGE_ORDER has 6 stages", () => {
    expect(STAGE_ORDER).toHaveLength(6);
  });
});
