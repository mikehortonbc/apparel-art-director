export type ProjectType = 'event' | 'retail';

export interface IntakeForm {
  audience: string;
  productFocus: string;
  eventName: string;
  eventDate: string;
  venue: string;
  styleDirection: string;
  colorPalette: string;
  typographyMood: string;
  slogan: string;
  legalNotes: string;
  constraints: string;
}

export interface PromptBuilderFields {
  concept: string;
  layoutNotes: string;
  typographyDirection: string;
  imageryDirection: string;
  productionSpecs: string;
  negativePrompt: string;
}

export interface RevisionFeedback {
  id: string;
  feedback: string;
  preserve: string;
  targetedArea: string;
  targetedInstruction: string;
  createdAt: string;
}

export interface PromptOutputs {
  masterPrompt: string;
  shortPrompt: string;
  revisionPrompt: string;
  targetedEditPrompt: string;
}

export interface VersionSnapshot {
  id: string;
  label: string;
  createdAt: string;
  summary: string;
  data: Omit<ProjectDraft, 'versions'>;
}

export interface ProjectDraft {
  id: string;
  name: string;
  type: ProjectType;
  roughPrompt: string;
  intake: IntakeForm;
  builder: PromptBuilderFields;
  outputs: PromptOutputs;
  lockState: {
    intake: boolean;
    builder: boolean;
    typography: boolean;
  };
  revisions: RevisionFeedback[];
  versions: VersionSnapshot[];
  updatedAt: string;
}

export interface Preset {
  id: string;
  name: string;
  type: ProjectType;
  intake: Partial<IntakeForm>;
  builder: Partial<PromptBuilderFields>;
}

export interface AdminSettings {
  hiddenTypographySystemPrompt: string;
  maxVersionsToKeep: number;
}
