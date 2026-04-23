export type PromptOutputKey =
  | 'master'
  | 'short'
  | 'stronger'
  | 'saferCommercial'
  | 'typographyHero'
  | 'creativeDirectorNotes';
export type ProjectType = 'Event Art' | 'Tourist/Retail Art';
export type AutofillConfidence = 'confirmed' | 'suggested' | 'missing';
export type IntakeField = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  helper?: string;
};
export type IntakeStep = {
  key: string;
  title: string;
  fields: IntakeField[];
};
export type RevisionCategory =
  | 'Audience Fit'
  | 'Brand Alignment'
  | 'Typography'
  | 'Color'
  | 'Composition'
  | 'Print Feasibility'
  | 'Merchandising';
export type EditMode =
  | 'full redesign'
  | 'partial image edit'
  | 'typography-only'
  | 'color-only'
  | 'layout-only'
  | 'background-only'
  | 'mockup-only'
  | 'scale-change edit';
export type ReferenceAsset = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  note: string;
};
export type HiddenSystemBehavior = {
  typographySystemPrompt: string;
  colorGuardrails: string;
  compositionGuardrails: string;
  printProductionGuardrails: string;
  merchandisingGuardrails: string;
  bannedVisualPatterns: string;
};
export type WorkflowState = {
  roughPrompt: string;
  currentStep: number;
  data: Record<string, string>;
  locks: Record<string, boolean>;
  confidence: Record<string, AutofillConfidence>;
  feedback: Array<{ id: string; category: RevisionCategory; note: string }>;
  outputs: Record<PromptOutputKey, string>;
  versions: Array<{
    id: string;
    timestamp: string;
    note: string;
    data: Record<string, string>;
    outputs: Record<PromptOutputKey, string>;
    feedback: Array<{ id: string; category: RevisionCategory; note: string }>;
    references: ReferenceAsset[];
  }>;
  presets: Record<string, Record<string, string>>;
  references: ReferenceAsset[];
  admin: {
    safetyMode: 'balanced' | 'conservative' | 'experimental';
    hiddenSystemBehavior: HiddenSystemBehavior;
  };
};
