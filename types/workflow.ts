export type PromptOutputKey =
  | 'master'
  | 'short'
  | 'stronger'
  | 'saferCommercial'
  | 'typographyHero'
  | 'creativeDirectorNotes';

export type IntakeField = {
  key: string;
  label: string;
};

export type IntakeStep = {
  key: string;
  title: string;
  fields: IntakeField[];
};

export type WorkflowState = {
  roughPrompt: string;
  currentStep: number;
  data: Record<string, string>;
  locks: Record<string, boolean>;
  feedback: string[];
  outputs: Record<PromptOutputKey, string>;
  versions: Array<{
    id: string;
    timestamp: string;
    note: string;
    data: Record<string, string>;
    outputs: Record<PromptOutputKey, string>;
    feedback: string[];
  }>;
  presets: Record<string, Record<string, string>>;
  admin: {
    safetyMode: 'balanced' | 'conservative' | 'experimental';
    typographySystemPrompt: string;
  };
};
