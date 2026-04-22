import { CreativeDraft } from "./types";

export function buildPrimaryPrompt(draft: CreativeDraft): string {
  const typeLogic =
    draft.projectType === "event"
      ? "Event art logic: prioritize urgency, date/time readability, and poster-first impact for social + physical collateral."
      : "Retail art logic: prioritize product clarity, conversion intent, and evergreen merchandising adaptability across placements.";

  return [
    `Project: ${draft.name}`,
    `Type: ${draft.projectType}`,
    typeLogic,
    `Rough direction: ${draft.roughPrompt}`,
    `Audience: ${draft.audience}`,
    `Brand essence: ${draft.brandEssence}`,
    `Product / offer focus: ${draft.productFocus}`,
    `Color direction: ${draft.colorDirection}`,
    `Typography mood: ${draft.typographyMood}`,
    `Layout direction: ${draft.layoutDirection}`,
    `Must keep if revising: ${draft.mustKeep}`,
    `Avoid: ${draft.avoid}`,
    `Reference vibes: ${draft.referenceVibes}`,
    `Hidden typography system prompt: ${draft.typographySystemPrompt}`,
    "Output as production-ready creative direction text with clear hierarchy guidance and print-safe typography recommendations."
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildRevisionPrompt(draft: CreativeDraft): string {
  return [
    "Revise existing concept.",
    `Preserve what works: ${draft.mustKeep || "Keep strongest hierarchy and visual anchors."}`,
    `User feedback: ${draft.revisionFeedback}`,
    "Do not do a full redesign unless explicitly asked.",
    `Project type logic remains: ${draft.projectType === "event" ? "event art" : "retail art"}.`
  ].join("\n");
}

export function buildTargetedEditPrompt(draft: CreativeDraft): string {
  return [
    "Targeted edit request (not full redesign).",
    `Edit scope: ${draft.targetedEditScope}`,
    `Specific edit instruction: ${draft.targetedEditInstruction}`,
    `Protected elements: ${draft.mustKeep || "current typography hierarchy and key composition"}`,
    "Return only deltas and rationale."
  ].join("\n");
}
