import { AdminSettings, Preset, ProjectDraft } from './types';

export const defaultAdminSettings: AdminSettings = {
  hiddenTypographySystemPrompt:
    'Typography is central. Ensure hierarchy, kerning realism, readable contrast, and print-safe letterforms. Prioritize legibility over decoration.',
  maxVersionsToKeep: 20
};

export const starterPresets: Preset[] = [
  {
    id: 'preset-event-bold',
    name: 'Bold Event Drop',
    type: 'event',
    intake: {
      styleDirection: 'High-energy event flyer style on apparel',
      typographyMood: 'Condensed bold sans, kinetic line breaks',
      colorPalette: 'Black base with neon accent',
      constraints: 'Typography must be readable from distance'
    },
    builder: {
      layoutNotes: 'Main headline top center, support text in stacked modules',
      productionSpecs: '3-color screen print, 12 inch max width'
    }
  },
  {
    id: 'preset-retail-clean',
    name: 'Clean Retail Capsule',
    type: 'retail',
    intake: {
      styleDirection: 'Minimal premium streetwear',
      typographyMood: 'Elegant grotesk mixed with subtle serif accent',
      colorPalette: 'Monochrome with one muted pop',
      constraints: 'Timeless and season-agnostic for retail shelf life'
    },
    builder: {
      layoutNotes: 'Subtle centered chest mark and back statement',
      productionSpecs: 'DTG primary, embroidery optional lockup'
    }
  }
];

export const createEmptyDraft = (): ProjectDraft => ({
  id: crypto.randomUUID(),
  name: 'Untitled Project',
  type: 'event',
  roughPrompt: '',
  intake: {
    audience: '',
    productFocus: '',
    eventName: '',
    eventDate: '',
    venue: '',
    styleDirection: '',
    colorPalette: '',
    typographyMood: '',
    slogan: '',
    legalNotes: '',
    constraints: ''
  },
  builder: {
    concept: '',
    layoutNotes: '',
    typographyDirection: '',
    imageryDirection: '',
    productionSpecs: '',
    negativePrompt: ''
  },
  outputs: {
    masterPrompt: '',
    shortPrompt: '',
    revisionPrompt: '',
    targetedEditPrompt: ''
  },
  lockState: {
    intake: false,
    builder: false,
    typography: false
  },
  revisions: [],
  versions: [],
  updatedAt: new Date().toISOString()
});
