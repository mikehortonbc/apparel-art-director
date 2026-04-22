export type ProjectType = "event" | "retail";

export interface CreativeDraft {
  id: string;
  name: string;
  projectType: ProjectType;
  roughPrompt: string;
  audience: string;
  brandEssence: string;
  productFocus: string;
  colorDirection: string;
  typographyMood: string;
  layoutDirection: string;
  mustKeep: string;
  avoid: string;
  referenceVibes: string;
  revisionFeedback: string;
  targetedEditScope: string;
  targetedEditInstruction: string;
  typographySystemPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_TYPOGRAPHY_SYSTEM_PROMPT =
  "Typography system: prioritize hierarchy clarity, print-safe tracking, high legibility at distance, and intentional contrast between headline and support copy.";

export function getDefaultDraft(): CreativeDraft {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Untitled Project",
    projectType: "event",
    roughPrompt: "",
    audience: "",
    brandEssence: "",
    productFocus: "",
    colorDirection: "",
    typographyMood: "",
    layoutDirection: "",
    mustKeep: "",
    avoid: "",
    referenceVibes: "",
    revisionFeedback: "",
    targetedEditScope: "",
    targetedEditInstruction: "",
    typographySystemPrompt: DEFAULT_TYPOGRAPHY_SYSTEM_PROMPT,
    createdAt: now,
    updatedAt: now
  };
}
