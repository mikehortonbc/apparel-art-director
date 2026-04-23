import {
  AutofillConfidence,
  EditMode,
  IntakeStep,
  PromptOutputKey,
  ProjectType,
  ReferenceAsset,
  WorkflowState
} from '@/types/workflow';

export const intakeSteps: IntakeStep[] = [
  {
    key: 'projectType',
    title: 'Project Type',
    fields: [{ key: 'projectType', label: 'Project type', required: true, helper: 'Event Art or Tourist/Retail Art' }]
  },
  {
    key: 'basicInfo',
    title: 'Basic Project Info',
    fields: [
      { key: 'projectName', label: 'Project name', required: true },
      { key: 'clientName', label: 'Client / Brand', required: true },
      { key: 'deadline', label: 'Deadline / launch date' },
      { key: 'garmentTypes', label: 'Garment type(s)', required: true }
    ]
  },
  {
    key: 'audienceMarket',
    title: 'Audience and Market',
    fields: [
      { key: 'audience', label: 'Target audience', required: true },
      { key: 'marketTier', label: 'Market tier (mass/premium/boutique)' },
      { key: 'pricePoint', label: 'Price point' },
      { key: 'salesChannel', label: 'Sales channel(s)' }
    ]
  },
  {
    key: 'artDirection',
    title: 'Art Direction',
    fields: [
      { key: 'theme', label: 'Theme / narrative', required: true },
      { key: 'mood', label: 'Mood and energy', required: true },
      { key: 'styleReferences', label: 'Style references' },
      { key: 'iconography', label: 'Iconography focus' }
    ]
  },
  {
    key: 'visualElements',
    title: 'Visual Elements',
    fields: [
      { key: 'primaryImagery', label: 'Primary imagery' },
      { key: 'secondaryElements', label: 'Secondary elements' },
      { key: 'colorDirection', label: 'Color direction', required: true },
      { key: 'compositionStyle', label: 'Composition style' }
    ]
  },
  {
    key: 'typography',
    title: 'Typography Preferences',
    fields: [
      { key: 'typeStyle', label: 'Type style', required: true },
      { key: 'typeMessage', label: 'Type message / copy', required: true },
      { key: 'typePlacement', label: 'Type placement' },
      { key: 'typePriority', label: 'Type priority level' }
    ]
  },
  {
    key: 'garmentProduction',
    title: 'Garment and Production',
    fields: [
      { key: 'printMethod', label: 'Print method' },
      { key: 'maxInkColors', label: 'Max ink colors' },
      { key: 'embellishments', label: 'Embroidery/special finishes' },
      { key: 'productionConstraints', label: 'Production constraints' }
    ]
  },
  {
    key: 'brandConstraints',
    title: 'Brand / Client Constraints',
    fields: [
      { key: 'mustKeep', label: 'Must include', required: true },
      { key: 'mustAvoid', label: 'Must avoid', required: true },
      { key: 'legalNotes', label: 'Legal/compliance notes' },
      { key: 'brandVoice', label: 'Brand voice guardrails' }
    ]
  },
  {
    key: 'referenceUploads',
    title: 'Reference Uploads',
    fields: [{ key: 'referenceNotes', label: 'Reference notes for uploaded files' }]
  },
  {
    key: 'outputPreferences',
    title: 'Output Preferences',
    fields: [
      { key: 'deliverables', label: 'Deliverables needed' },
      { key: 'aspectRatios', label: 'Aspect ratios' },
      { key: 'mockupNeeds', label: 'Mockup requirements' },
      { key: 'priorityOutput', label: 'Priority output (master/short/etc.)' }
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

export const editModes: EditMode[] = [
  'full redesign',
  'partial image edit',
  'typography-only',
  'color-only',
  'layout-only',
  'background-only',
  'mockup-only',
  'scale-change edit'
];

const defaultData = Object.fromEntries(intakeSteps.flatMap((s) => s.fields.map((f) => [f.key, ''])));
const defaultConfidence = Object.fromEntries(
  intakeSteps.flatMap((s) => s.fields.map((f) => [f.key, 'missing' as AutofillConfidence]))
);
const defaultOutputs = outputKeys.reduce((acc, key) => ({ ...acc, [key]: '' }), {} as Record<PromptOutputKey, string>);

export function makeDefaultState(): WorkflowState {
  return {
    roughPrompt: '',
    currentStep: 0,
    data: { ...defaultData, projectType: 'Event Art' },
    locks: {},
    confidence: { ...defaultConfidence, projectType: 'confirmed' },
    feedback: [],
    outputs: { ...defaultOutputs },
    versions: [],
    presets: buildBusinessPresets(),
    references: [],
    admin: {
      safetyMode: 'balanced',
      hiddenSystemBehavior: {
        typographySystemPrompt:
          'Prioritize legibility hierarchy, kerning fidelity, textile interaction, print-production realism, and merchandising clarity while preserving expressive type energy.',
        colorGuardrails: 'Ensure color contrast translates to cotton, fleece, and blended garments under studio and daylight lighting.',
        compositionGuardrails: 'Protect focal hierarchy, readable negative space, and chest-print scaling discipline.',
        printProductionGuardrails: 'Respect print count, trapping, separations, and embroidery compatibility.',
        merchandisingGuardrails: 'Favor retail shelf impact and PDP thumbnail clarity.',
        bannedVisualPatterns: 'No photoreal faces, no trademarked logos, no muddy low-contrast type.'
      }
    }
  };
}

function buildBusinessPresets(): Record<string, Record<string, string>> {
  return {
    'National Park Retail': {
      projectType: 'Tourist/Retail Art',
      projectName: 'National Park Visitor Tee',
      clientName: 'Summit Trails Co.',
      garmentTypes: 'Unisex tee and crewneck',
      audience: 'Park visitors, gift shoppers',
      theme: 'Destination pride with heritage illustration',
      mood: 'Warm, adventurous, collectible',
      colorDirection: 'Forest green, cream, sunset rust',
      typeStyle: 'Vintage serif + badge sans',
      typeMessage: 'Explore • Protect • Return',
      mustKeep: 'Park name and est. year',
      mustAvoid: 'Unlicensed wildlife marks'
    },
    'Softball Event': {
      projectType: 'Event Art',
      projectName: 'Summer Softball Bash',
      clientName: 'City Sports Council',
      garmentTypes: 'Event tee + hoodie',
      audience: 'Players and families',
      theme: 'Tournament energy',
      mood: 'Fast, bold, team-spirited',
      colorDirection: 'Navy, white, neon lime',
      typeStyle: 'Athletic slab',
      typeMessage: 'Swing Big • Play Loud',
      mustKeep: 'Event date + venue',
      mustAvoid: 'Overly detailed gradients'
    },
    'Baseball Tournament': {
      projectType: 'Event Art',
      projectName: 'Regional Baseball Tournament',
      clientName: 'State Athletics',
      garmentTypes: 'Tri-blend tee',
      audience: 'Youth teams, coaches',
      theme: 'Competitive pride',
      mood: 'Classic sport authority',
      colorDirection: 'Red, navy, heather gray',
      typeStyle: 'Varsity block',
      typeMessage: 'Earn Every Inning',
      mustKeep: 'Tournament bracket motif',
      mustAvoid: 'Illegible script typography'
    },
    'School Spirit': {
      projectType: 'Event Art',
      projectName: 'Homecoming Spirit Drop',
      clientName: 'Westfield High',
      garmentTypes: 'Crewneck + hoodie',
      audience: 'Students, alumni',
      theme: 'Pride and belonging',
      mood: 'Loud, optimistic, communal',
      colorDirection: 'School maroon + gold',
      typeStyle: 'Collegiate block + script accent',
      typeMessage: 'Tradition Never Graduates',
      mustKeep: 'Mascot + class year',
      mustAvoid: 'Off-brand color substitutions'
    },
    'Boutique Women Graphic': {
      projectType: 'Tourist/Retail Art',
      projectName: 'Boutique Women Graphic Tee',
      clientName: 'Willow Thread',
      garmentTypes: 'Women fitted tee',
      audience: 'Women 24-40 boutique buyers',
      theme: 'Intentional lifestyle expression',
      mood: 'Soft premium confidence',
      colorDirection: 'Dusty rose, oat, espresso',
      typeStyle: 'Elegant serif with hand-letter touch',
      typeMessage: 'Stay Wild, Stay Kind',
      mustKeep: 'Handcrafted feeling',
      mustAvoid: 'Harsh neon palette'
    },
    'Western Ranch Event': {
      projectType: 'Event Art',
      projectName: 'Ranch Days Festival',
      clientName: 'Red Mesa Ranch',
      garmentTypes: 'Heavyweight tee + cap mockup',
      audience: 'Rodeo families and visitors',
      theme: 'Western heritage revival',
      mood: 'Rugged, nostalgic, bold',
      colorDirection: 'Sand, rust, faded denim',
      typeStyle: 'Woodtype western',
      typeMessage: 'Ride Hard • Ranch Proud',
      mustKeep: 'Year + ranch crest',
      mustAvoid: 'Modern techno motifs'
    },
    'Premium Destination Sweatshirt': {
      projectType: 'Tourist/Retail Art',
      projectName: 'Premium Destination Crew',
      clientName: 'Harbor Point',
      garmentTypes: 'Premium brushed fleece',
      audience: 'Destination travelers seeking elevated souvenir',
      theme: 'Luxury travel memory',
      mood: 'Refined, timeless, cozy',
      colorDirection: 'Navy, stone, antique white',
      typeStyle: 'High-contrast serif',
      typeMessage: 'Harbor Point Coastal Club',
      mustKeep: 'Location name prominence',
      mustAvoid: 'Cheap novelty clip-art'
    },
    'Embroidery-Forward Design': {
      projectType: 'Tourist/Retail Art',
      projectName: 'Embroidery Capsule',
      clientName: 'Threadline Goods',
      garmentTypes: 'Dad hat + quarter zip',
      audience: 'Premium casual shoppers',
      theme: 'Texture-first identity',
      mood: 'Minimal, tactile, elevated',
      colorDirection: 'Olive, cream, brass',
      typeStyle: 'Compact sans monogram',
      typeMessage: 'Crafted for Everyday',
      mustKeep: 'Embroidery stitch realism',
      mustAvoid: 'Fine details impossible to stitch'
    }
  };
}

export function parsePromptToForm(
  roughPrompt: string,
  locks: Record<string, boolean>,
  existing: Record<string, string>
): { data: Record<string, string>; confidence: Record<string, AutofillConfidence> } {
  const p = roughPrompt.toLowerCase();
  const next = { ...existing };
  const confidence: Record<string, AutofillConfidence> = Object.fromEntries(
    Object.keys(existing).map((k) => [k, existing[k] ? 'confirmed' : 'missing'])
  );

  const setIfUnlocked = (key: string, value: string, certainty: AutofillConfidence = 'suggested') => {
    if (locks[key]) return;
    if (!value.trim()) return;
    next[key] = value.trim();
    confidence[key] = certainty;
  };

  setIfUnlocked('projectName', roughPrompt.slice(0, 72), 'suggested');

  if (p.includes('event') || p.includes('tournament') || p.includes('festival')) {
    setIfUnlocked('projectType', 'Event Art', 'confirmed');
  }
  if (p.includes('souvenir') || p.includes('gift shop') || p.includes('tourist') || p.includes('destination')) {
    setIfUnlocked('projectType', 'Tourist/Retail Art', 'confirmed');
  }

  const dictionaryPatterns: Array<[string, RegExp, AutofillConfidence]> = [
    ['clientName', /(?:brand|client)[:\-]\s*([^\n\.]+)/i, 'confirmed'],
    ['audience', /audience[:\-]\s*([^\n\.]+)/i, 'confirmed'],
    ['theme', /(?:theme|concept|narrative)[:\-]\s*([^\n\.]+)/i, 'confirmed'],
    ['mood', /mood[:\-]\s*([^\n\.]+)/i, 'confirmed'],
    ['colorDirection', /color(?:s| palette)?[:\-]\s*([^\n\.]+)/i, 'confirmed'],
    ['typeStyle', /(?:typography|type style)[:\-]\s*([^\n\.]+)/i, 'confirmed'],
    ['typeMessage', /(?:copy|slogan|message)[:\-]\s*([^\n\.]+)/i, 'suggested'],
    ['mustKeep', /(?:must keep|must include|non-negotiable)[:\-]\s*([^\n\.]+)/i, 'confirmed'],
    ['mustAvoid', /(?:avoid|must avoid|do not)[:\-]\s*([^\n\.]+)/i, 'confirmed'],
    ['printMethod', /(?:print|production method)[:\-]\s*([^\n\.]+)/i, 'suggested'],
    ['garmentTypes', /(?:garment|product|sku)[:\-]\s*([^\n\.]+)/i, 'suggested'],
    ['deliverables', /deliverables?[:\-]\s*([^\n\.]+)/i, 'confirmed']
  ];

  dictionaryPatterns.forEach(([field, regex, certainty]) => {
    const match = roughPrompt.match(regex);
    if (match?.[1]) setIfUnlocked(field, match[1], certainty);
  });

  if (p.includes('embroidery')) setIfUnlocked('embellishments', 'Embroidery-forward execution', 'suggested');
  if (p.includes('screen print')) setIfUnlocked('printMethod', 'Screen print', 'confirmed');
  if (p.includes('dtg')) setIfUnlocked('printMethod', 'DTG', 'confirmed');

  return { data: next, confidence };
}

export function buildBasePrompt(state: WorkflowState) {
  const d = state.data;
  const refs = state.references.map((r) => r.name).join(', ') || 'None uploaded';
  return [
    `Project Type: ${d.projectType as ProjectType}`,
    `Project: ${d.projectName} | Client: ${d.clientName} | Deadline: ${d.deadline}`,
    `Garments: ${d.garmentTypes}`,
    `Audience: ${d.audience} | Market: ${d.marketTier} | Price: ${d.pricePoint}`,
    `Sales channels: ${d.salesChannel}`,
    `Theme: ${d.theme} | Mood: ${d.mood}`,
    `Iconography: ${d.iconography} | Imagery: ${d.primaryImagery}`,
    `Secondary elements: ${d.secondaryElements}`,
    `Color direction: ${d.colorDirection} | Composition: ${d.compositionStyle}`,
    `Type style: ${d.typeStyle} | Message: ${d.typeMessage} | Placement: ${d.typePlacement}`,
    `Type priority: ${d.typePriority}`,
    `Production: ${d.printMethod}; max inks ${d.maxInkColors}; embellishments ${d.embellishments}`,
    `Production constraints: ${d.productionConstraints}`,
    `Must include: ${d.mustKeep}`,
    `Must avoid: ${d.mustAvoid}`,
    `Legal notes: ${d.legalNotes} | Brand voice: ${d.brandVoice}`,
    `Reference files: ${refs} | Notes: ${d.referenceNotes}`,
    `Output preferences: ${d.deliverables}; aspect ${d.aspectRatios}; mockups ${d.mockupNeeds}; priority ${d.priorityOutput}`,
    `Safety mode: ${state.admin.safetyMode}`
  ].join('\n');
}

function projectTypeDirective(type: ProjectType | string) {
  if (type === 'Event Art') {
    return 'Event Art mode: prioritize date/location clarity, participant excitement, sponsor-safe hierarchy, and commemorative urgency.';
  }
  return 'Tourist/Retail Art mode: prioritize evergreen sell-through, destination storytelling, giftability, and shelf/PDP appeal.';
}

export function buildPromptPack(state: WorkflowState): Record<PromptOutputKey, string> {
  const base = buildBasePrompt(state);
  const behavior = state.admin.hiddenSystemBehavior;
  const feedback =
    state.feedback.length > 0
      ? `\nRevision inputs: ${state.feedback.map((f) => `${f.category}: ${f.note}`).join(' | ')}`
      : '';
  const directive = projectTypeDirective(state.data.projectType);

  return {
    master: `MASTER PROMPT\n${directive}\n${base}${feedback}\nApply system guardrails:\n- ${behavior.colorGuardrails}\n- ${behavior.compositionGuardrails}\n- ${behavior.printProductionGuardrails}\n- ${behavior.merchandisingGuardrails}\nForbidden patterns: ${behavior.bannedVisualPatterns}`,
    short: `SHORT PROMPT\n${directive}\n${base}\nReturn concise brief <=120 words preserving garment, audience, and production constraints.`,
    stronger: `STRONGER / BOLDER\n${directive}\n${base}\nPush higher contrast, larger typography hierarchy, dynamic composition, and stronger shelf impact while preserving must-keep constraints.`,
    saferCommercial: `SAFER COMMERCIAL\n${directive}\n${base}\nUse safer mainstream direction, broad market readability, and reduced visual risk; avoid polarizing motifs.`,
    typographyHero: `TYPOGRAPHY-HERO\nHidden typography system behavior:\n${behavior.typographySystemPrompt}\n${base}\nTypography must drive concept with production-realistic sizing and legibility.`,
    creativeDirectorNotes: `CREATIVE DIRECTOR NOTES\nMode: ${state.data.projectType}\nWhat wins: ${state.data.theme}\nAudience fit: ${state.data.audience}\nNon-negotiables: ${state.data.mustKeep}\nRisks to avoid: ${state.data.mustAvoid}\nExecution checkpoints: ${behavior.printProductionGuardrails}; ${behavior.merchandisingGuardrails}.`
  };
}

export function buildTargetedEditPrompt(params: {
  editMode: EditMode;
  targetSection: PromptOutputKey;
  editGoal: string;
  constraints: string;
  source: string;
}) {
  return [
    'TARGETED EDIT PROMPT',
    `Edit mode: ${params.editMode}`,
    `Target output section: ${params.targetSection}`,
    `Edit goal: ${params.editGoal}`,
    `Constraints: ${params.constraints || 'None provided'}`,
    'Source to revise:',
    params.source
  ].join('\n');
}

export function reviewMissingFields(state: WorkflowState): string[] {
  return intakeSteps
    .flatMap((step) => step.fields)
    .filter((field) => field.required && !state.data[field.key]?.trim())
    .map((field) => `${field.label} is required`);
}

export function clampStep(step: number) {
  return Math.max(0, Math.min(intakeSteps.length - 1, step));
}

export function formatReferenceFromFile(file: File): ReferenceAsset {
  return {
    id: crypto.randomUUID().slice(0, 8),
    name: file.name,
    size: file.size,
    type: file.type || 'unknown',
    uploadedAt: new Date().toISOString(),
    note: ''
  };
}
