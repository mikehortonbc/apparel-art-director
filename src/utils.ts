import { AdminSettings, ProjectDraft, ProjectType, RevisionFeedback } from './types';

export const projectTypeLabel = (type: ProjectType): string =>
  type === 'event' ? 'Event Art' : 'Retail Art';

const findAfterKeyword = (text: string, keyword: string): string => {
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return '';
  const sliced = text.slice(idx + keyword.length).trim();
  return sliced.split(/[.\n,]/)[0]?.trim() ?? '';
};

export const autofillFromRoughPrompt = (draft: ProjectDraft): ProjectDraft => {
  const source = draft.roughPrompt;
  const lowered = source.toLowerCase();

  const inferredType: ProjectType = lowered.includes('festival') || lowered.includes('tour') || lowered.includes('event')
    ? 'event'
    : lowered.includes('retail') || lowered.includes('store') || lowered.includes('collection')
      ? 'retail'
      : draft.type;

  return {
    ...draft,
    type: inferredType,
    intake: {
      ...draft.intake,
      audience: draft.intake.audience || findAfterKeyword(source, 'for'),
      eventName: inferredType === 'event' ? draft.intake.eventName || findAfterKeyword(source, 'event') : draft.intake.eventName,
      styleDirection: draft.intake.styleDirection || (lowered.includes('vintage') ? 'Vintage distressed poster energy' : ''),
      colorPalette: draft.intake.colorPalette || (lowered.includes('neon') ? 'Neon accent + dark base' : ''),
      typographyMood: draft.intake.typographyMood || (lowered.includes('serif') ? 'Expressive serif headline + clean support sans' : 'Impactful modern sans hierarchy'),
      slogan: draft.intake.slogan || findAfterKeyword(source, 'saying')
    },
    builder: {
      ...draft.builder,
      concept: draft.builder.concept || source,
      typographyDirection:
        draft.builder.typographyDirection ||
        (lowered.includes('readable') ? 'Prioritize legibility and spacing at first glance' : 'Build strong hierarchy with clear focal headline'),
      imageryDirection:
        draft.builder.imageryDirection ||
        (inferredType === 'event'
          ? 'Use energetic motion cues and atmospheric accents around type'
          : 'Use restrained supportive graphics that elevate product premium feel')
    },
    updatedAt: new Date().toISOString()
  };
};

export const buildMasterPrompt = (draft: ProjectDraft, admin: AdminSettings): string => {
  const typeGuardrail =
    draft.type === 'event'
      ? 'Event art logic: emphasize urgency, date readability, and high-impact promotional hierarchy.'
      : 'Retail art logic: emphasize timelessness, brand consistency, and shelf-life versatility.';

  const locked = Object.entries(draft.lockState)
    .filter(([, value]) => value)
    .map(([key]) => key)
    .join(', ');

  return [
    `PROJECT: ${draft.name} (${draft.type.toUpperCase()})`,
    typeGuardrail,
    `Rough intent: ${draft.roughPrompt || 'N/A'}`,
    `Audience: ${draft.intake.audience || 'N/A'}`,
    `Product focus: ${draft.intake.productFocus || 'N/A'}`,
    `Event: ${draft.intake.eventName || 'N/A'} ${draft.intake.eventDate || ''} ${draft.intake.venue || ''}`,
    `Style: ${draft.intake.styleDirection || 'N/A'}`,
    `Color palette: ${draft.intake.colorPalette || 'N/A'}`,
    `Typography mood: ${draft.intake.typographyMood || 'N/A'}`,
    `Slogan/text: ${draft.intake.slogan || 'N/A'}`,
    `Concept: ${draft.builder.concept || 'N/A'}`,
    `Layout: ${draft.builder.layoutNotes || 'N/A'}`,
    `Typography direction: ${draft.builder.typographyDirection || 'N/A'}`,
    `Imagery: ${draft.builder.imageryDirection || 'N/A'}`,
    `Production specs: ${draft.builder.productionSpecs || 'N/A'}`,
    `Negative prompt constraints: ${draft.builder.negativePrompt || 'N/A'}`,
    `Legal notes: ${draft.intake.legalNotes || 'N/A'}`,
    `Additional constraints: ${draft.intake.constraints || 'N/A'}`,
    locked ? `Locked sections to preserve: ${locked}` : 'No locked sections.',
    `Hidden typography system prompt: ${admin.hiddenTypographySystemPrompt}`
  ].join('\n');
};

export const buildRevisionPrompt = (draft: ProjectDraft, feedback: RevisionFeedback): string => {
  return [
    'REVISION MODE: preserve what works while improving targeted concerns.',
    `Original concept: ${draft.builder.concept || draft.roughPrompt || 'N/A'}`,
    `Keep unchanged: ${feedback.preserve || 'Hierarchy and strong typography choices that already work.'}`,
    `Feedback to address: ${feedback.feedback}`,
    `Locked controls: ${JSON.stringify(draft.lockState)}`,
    `Do NOT full redesign unless requested. This is iterative revision.`
  ].join('\n');
};

export const buildTargetedEditPrompt = (draft: ProjectDraft, feedback: RevisionFeedback): string => {
  return [
    'TARGETED EDIT MODE (not a full redesign).',
    `Edit area: ${feedback.targetedArea || 'Typography lockup details'}`,
    `Instruction: ${feedback.targetedInstruction || feedback.feedback}`,
    `Elements to preserve exactly: ${feedback.preserve || 'Composition, palette, and overall concept.'}`,
    `Project type logic: ${draft.type === 'event' ? 'Maintain event urgency/readability' : 'Maintain retail premium timelessness'}`
  ].join('\n');
};
