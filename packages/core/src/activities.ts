export type ActivityType =
  | "color-letter"
  | "color-number"
  | "trace-letter"
  | "tap-sound"
  | "match-picture-word"
  | "find-in-scene"
  | "listen-repeat"
  | "concept-table-review";

export type Activity = {
  id: string;
  type: ActivityType;
  stage: string;
  lang: string;
  prompt: string;       // short, shown to child (or spoken)
  itemId: string;
  options?: string[];   // for tap/match
  audioUrl?: string;
  imageUrl?: string;
};
