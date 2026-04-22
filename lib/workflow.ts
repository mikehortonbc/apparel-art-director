import { IntakeStep, PromptOutputKey, WorkflowState } from '@/types/workflow';

export const intakeSteps: IntakeStep[] = [
  {
    key: 'project',
    title: 'Project Basics',
    fields: [
      { key: 'projectName', label: 'Project name' },
      { key: 'brand', label: 'Brand' },
      { key: 'dropSeason', label: 'Drop / Season' },
      { key: 'goal', label: 'Primary business goal' }
    ]
  },
  {
    key: 'product',
    title: 'Product Scope',
    fields: [
      { key: 'productType', label: 'Product type' },
      { key: 'heroSku', label: 'Hero SKU' },
      { key: 'silhouette', label: 'Silhouette / fit' },
      { key: 'materials', label: 'Materials and texture' }
    ]
  },
  {
    key: 'creative',
    title: 'Creative Direction',
    fields: [
      { key: 'audience', label: 'Target audience' },
      { key: 'mood', label: 'Mood' },
      { key: 'colorDirection', label: 'Color direction' },
      { key: 'references', label: 'Visual references' }
    ]
  },
  {
    key: 'typography',
    title: 'Typography + Composition',
    fields: [
      { key: 'typeStyle', label: 'Typography style' },
      { key: 'typeMessage', label: 'Typography message / copy' },
      { key: 'layoutStyle', label: 'Layout style' },
      { key: 'logoTreatment', label: 'Logo treatment' }
    ]
  },
  {
    key: 'constraints',
    title: 'Production Constraints',
    fields: [
      { key: 'platforms', label: 'Target channels' },
      { key: 'aspectRatios', label: 'Aspect ratios' },
      { key: 'mustKeep', label: 'Must keep' },
      { key: 'mustAvoid', label: 'Must avoid' }
    ]
  }
];

export const outputKeys: PromptOutputKey[] = [
  'master',
  'short',
  'stronger',
  'saferCommercial',
  'typographyHero',
  'creativeDirectorNotes'
];

export const defaultTypographySystemPrompt =
  'Prioritize legibility hierarchy, kerning fidelity, textile interaction, print-production realism, and merchandising clarity while preserving expressive type energy.';

const defaultData = Object.fromEntries(intakeSteps.flatMap((s) => s.fields.map((f) => [f.key, ''])));
const defaultOutputs = outputKeys.reduce(
  (acc, key) => ({ ...acc, [key]: '' }),
  {} as Record<PromptOutputKey, string>
);

export function makeDefaultState(): WorkflowState {
  return {
    roughPrompt: '',
    currentStep: 0,
    data: { ...defaultData },
    locks: {},
    feedback: [],
    outputs: { ...defaultOutputs },
    versions: [],
    presets: {
      'Streetwear Drop': {
        projectName: 'Streetwear Drop 01',
        brand: 'Northline',
        goal: 'Increase launch conversion',
        productType: 'Hoodie',
        mood: 'Gritty kinetic street energy',
        colorDirection: 'Charcoal, safety orange accents',
        typeStyle: 'Compressed bold sans',
        layoutStyle: 'Diagonal dynamic crop',
        platforms: 'Instagram, TikTok',
        aspectRatios: '4:5, 9:16'
      },
      'Performance Minimal': {
        projectName: 'Performance Capsule',
        brand: 'AeroForm',
        goal: 'Premium repositioning',
        productType: 'Training tee',
        mood: 'Clean technical minimalism',
        colorDirection: 'Monochrome with cobalt accent',
        typeStyle: 'Neo-grotesk system type',
        layoutStyle: 'Grid strict, generous whitespace',
        platforms: 'Meta ads, PDP hero',
        aspectRatios: '1:1, 4:5, 16:9'
      }
    },
    admin: {
      safetyMode: 'balanced',
      typographySystemPrompt: defaultTypographySystemPrompt
    }
  };
}

export function parsePromptToForm(roughPrompt: string, locks: Record<string, boolean>, existing: Record<string, string>) {
  const p = roughPrompt.toLowerCase();
  const next = { ...existing };
  const setIfUnlocked = (key: string, value: string) => {
    if (!locks[key] && value.trim()) next[key] = value.trim();
  };

  setIfUnlocked('projectName', roughPrompt.slice(0, 64));
  if (p.includes('hoodie')) setIfUnlocked('productType', 'Hoodie');
  if (p.includes('tee') || p.includes('t-shirt')) setIfUnlocked('productType', 'T-Shirt');
  if (p.includes('gen z')) setIfUnlocked('audience', 'Gen Z streetwear audience');
  if (p.includes('luxury')) setIfUnlocked('mood', 'Elevated luxury');
  if (p.includes('gritty')) setIfUnlocked('mood', 'Gritty urban energy');
  if (p.includes('instagram') || p.includes('tiktok')) setIfUnlocked('platforms', 'Instagram, TikTok');
  if (p.includes('9:16') || p.includes('4:5')) setIfUnlocked('aspectRatios', '4:5 and 9:16');

  const patterns: Array<[string, RegExp]> = [
    ['mood', /mood[:\-]\s*([^\n\.]+)/i],
    ['colorDirection', /color[s]?[:\-]\s*([^\n\.]+)/i],
    ['mustKeep', /must keep[:\-]\s*([^\n\.]+)/i],
    ['mustAvoid', /avoid[:\-]\s*([^\n\.]+)/i],
    ['typeStyle', /typography[:\-]\s*([^\n\.]+)/i],
    ['references', /reference[s]?[:\-]\s*([^\n\.]+)/i],
    ['goal', /goal[:\-]\s*([^\n\.]+)/i],
    ['brand', /brand[:\-]\s*([^\n\.]+)/i]
  ];

  patterns.forEach(([field, regex]) => {
    const match = roughPrompt.match(regex);
    if (match?.[1]) setIfUnlocked(field, match[1]);
  });

  return next;
}

export function buildBasePrompt(data: Record<string, string>, safetyMode: string) {
  return [
    `Project: ${data.projectName}`,
    `Brand: ${data.brand}`,
    `Drop/Season: ${data.dropSeason}`,
    `Goal: ${data.goal}`,
    `Product: ${data.productType} | Hero SKU: ${data.heroSku}`,
    `Silhouette: ${data.silhouette} | Materials: ${data.materials}`,
    `Audience: ${data.audience}`,
    `Mood: ${data.mood}`,
    `Colors: ${data.colorDirection}`,
    `References: ${data.references}`,
    `Type style: ${data.typeStyle}`,
    `Type message: ${data.typeMessage}`,
    `Logo treatment: ${data.logoTreatment}`,
    `Layout style: ${data.layoutStyle}`,
    `Channels: ${data.platforms}`,
    `Aspect ratios: ${data.aspectRatios}`,
    `Must keep: ${data.mustKeep}`,
    `Must avoid: ${data.mustAvoid}`,
    `Safety mode: ${safetyMode}`
  ].join('\n');
}

export function buildPromptPack(state: WorkflowState): Record<PromptOutputKey, string> {
  const base = buildBasePrompt(state.data, state.admin.safetyMode);
  const feedback = state.feedback.length > 0 ? `\nFeedback to integrate: ${state.feedback.join(' | ')}` : '';

  return {
    master: `MASTER PROMPT\n${base}${feedback}\nGenerate a complete apparel creative-direction system with campaign hero, alternates, and production-ready specificity.`,
    short: `SHORT PROMPT\n${base}\nReturn a concise direction <=120 words while preserving merchandising-critical details.`,
    stronger: `STRONGER / BOLDER\n${base}\nPush contrast, attitude, asymmetry, motion cues, and aggressive type scale without breaking brand anchors.`,
    saferCommercial: `SAFER COMMERCIAL\n${base}\nFavor mainstream readability, cleaner composition, and conservative brand-safe choices suitable for broad paid media.`,
    typographyHero: `TYPOGRAPHY-HERO\nSYSTEM TYPOGRAPHY DIRECTIVE:\n${state.admin.typographySystemPrompt}\n\n${base}\nTypography is hero; maintain garment realism, logo legibility, and print feasibility.`,
    creativeDirectorNotes: `CREATIVE DIRECTOR NOTES\nObjective: ${state.data.goal}\nNon-negotiables: ${state.data.mustKeep}\nDo-not-cross lines: ${state.data.mustAvoid}\nExecution notes: prioritize apparel silhouette clarity and channel utility across ${state.data.platforms}.`
  };
}

export function clampStep(step: number) {
  return Math.max(0, Math.min(intakeSteps.length - 1, step));
}
