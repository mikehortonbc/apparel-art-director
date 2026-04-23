'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  buildPromptPack,
  buildTargetedEditPrompt,
  clampStep,
  editModes,
  formatReferenceFromFile,
  intakeSteps,
  makeDefaultState,
  outputKeys,
  parsePromptToForm,
  reviewMissingFields
} from '@/lib/workflow';
import { EditMode, PromptOutputKey, RevisionCategory, WorkflowState } from '@/types/workflow';

const STORAGE_KEY = 'aad_workflow_v4';
const feedbackCategories: RevisionCategory[] = [
  'Audience Fit',
  'Brand Alignment',
  'Typography',
  'Color',
  'Composition',
  'Print Feasibility',
  'Merchandising'
];

export default function Page() {
  const [state, setState] = useState<WorkflowState>(() => makeDefaultState());
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeModule, setActiveModule] = useState<'intake' | 'review' | 'outputs' | 'revisions' | 'ops' | 'admin'>('intake');

  const [feedbackCategory, setFeedbackCategory] = useState<RevisionCategory>('Brand Alignment');
  const [feedbackNote, setFeedbackNote] = useState('');

  const [targetSection, setTargetSection] = useState<PromptOutputKey>('master');
  const [editMode, setEditMode] = useState<EditMode>('full redesign');
  const [targetGoal, setTargetGoal] = useState('');
  const [targetConstraints, setTargetConstraints] = useState('');
  const [targetedPrompt, setTargetedPrompt] = useState('');

  const [presetName, setPresetName] = useState('National Park Retail');
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    const fallback = makeDefaultState();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setState(fallback);
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<WorkflowState>;
      setState({
        ...fallback,
        ...parsed,
        currentStep: clampStep(parsed.currentStep ?? 0),
        data: { ...fallback.data, ...(parsed.data ?? {}) },
        locks: parsed.locks ?? {},
        confidence: { ...fallback.confidence, ...(parsed.confidence ?? {}) },
        feedback: parsed.feedback ?? [],
        outputs: { ...fallback.outputs, ...(parsed.outputs ?? {}) },
        versions: parsed.versions ?? [],
        presets: { ...fallback.presets, ...(parsed.presets ?? {}) },
        references: parsed.references ?? [],
        admin: {
          ...fallback.admin,
          ...(parsed.admin ?? {}),
          hiddenSystemBehavior: {
            ...fallback.admin.hiddenSystemBehavior,
            ...(parsed.admin?.hiddenSystemBehavior ?? {})
          }
        }
      });
    } catch {
      setState(fallback);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isHydrated, state]);

  const currentStep = intakeSteps[clampStep(state.currentStep)];
  const missingWarnings = useMemo(() => reviewMissingFields(state), [state]);

  const updateField = (key: string, value: string) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
      confidence: {
        ...prev.confidence,
        [key]: value.trim() ? 'confirmed' : 'missing'
      }
    }));
  };

  const applyAutofill = () => {
    setState((prev) => {
      const parsed = parsePromptToForm(prev.roughPrompt, prev.locks, prev.data);
      return {
        ...prev,
        data: parsed.data,
        confidence: { ...prev.confidence, ...parsed.confidence }
      };
    });
    setStatus('Autofill complete with field confidence statuses.');
  };

  const toggleLock = (key: string) => {
    setState((prev) => ({ ...prev, locks: { ...prev.locks, [key]: !prev.locks[key] } }));
  };

  const lockAll = (isLocked: boolean) => {
    setState((prev) => ({ ...prev, locks: Object.fromEntries(Object.keys(prev.data).map((key) => [key, isLocked])) }));
    setStatus(isLocked ? 'All fields locked.' : 'All fields unlocked.');
  };

  const buildOutputs = (note = 'manual output build') => {
    setState((prev) => {
      const outputs = buildPromptPack(prev);
      return {
        ...prev,
        outputs,
        versions: [
          {
            id: crypto.randomUUID().slice(0, 8),
            timestamp: new Date().toISOString(),
            note,
            data: { ...prev.data },
            outputs,
            feedback: [...prev.feedback],
            references: [...prev.references]
          },
          ...prev.versions
        ]
      };
    });
    setStatus('Prompt pack built and version saved.');
  };

  const addFeedbackChip = () => {
    if (!feedbackNote.trim()) return;
    setState((prev) => ({
      ...prev,
      feedback: [...prev.feedback, { id: crypto.randomUUID().slice(0, 8), category: feedbackCategory, note: feedbackNote.trim() }]
    }));
    setFeedbackNote('');
  };

  const removeFeedbackChip = (id: string) => {
    setState((prev) => ({ ...prev, feedback: prev.feedback.filter((chip) => chip.id !== id) }));
  };

  const applyRevision = () => {
    buildOutputs('revision from structured feedback chips');
  };

  const handleReferenceUpload = (files: FileList | null) => {
    if (!files?.length) return;
    setState((prev) => ({
      ...prev,
      references: [...prev.references, ...Array.from(files).map((file) => formatReferenceFromFile(file))]
    }));
    setStatus(`${files.length} reference file(s) added.`);
  };

  const updateReferenceNote = (id: string, note: string) => {
    setState((prev) => ({
      ...prev,
      references: prev.references.map((ref) => (ref.id === id ? { ...ref, note } : ref))
    }));
  };

  const removeReference = (id: string) => {
    setState((prev) => ({ ...prev, references: prev.references.filter((ref) => ref.id !== id) }));
  };

  const buildTargetedEdit = () => {
    if (!targetGoal.trim()) {
      setStatus('Add an edit goal before building targeted edit prompt.');
      return;
    }

    setTargetedPrompt(
      buildTargetedEditPrompt({
        editMode,
        targetSection,
        editGoal: targetGoal,
        constraints: targetConstraints,
        source: state.outputs[targetSection] || 'No generated output yet. Build outputs first.'
      })
    );
  };

  const loadPreset = () => {
    const preset = state.presets[presetName];
    if (!preset) return;
    setState((prev) => {
      const nextData = { ...prev.data };
      Object.entries(preset).forEach(([key, value]) => {
        if (!prev.locks[key]) nextData[key] = value;
      });
      return { ...prev, data: nextData };
    });
    setStatus(`Loaded preset: ${presetName}`);
  };

  const restoreVersion = (id: string) => {
    const version = state.versions.find((item) => item.id === id);
    if (!version) return;
    setState((prev) => ({
      ...prev,
      data: { ...version.data },
      outputs: { ...version.outputs },
      feedback: [...version.feedback],
      references: [...version.references]
    }));
  };

  const confidenceBadge = (fieldKey: string) => {
    const conf = state.confidence[fieldKey] ?? 'missing';
    const palette =
      conf === 'confirmed' ? 'bg-emerald-900 text-emerald-200' : conf === 'suggested' ? 'bg-amber-900 text-amber-200' : 'bg-slate-800 text-slate-300';
    return <span className={`rounded px-2 py-0.5 text-xs ${palette}`}>{conf}</span>;
  };

  return (
    <main className="mx-auto max-w-7xl space-y-4 p-4">
      <Card className="space-y-2">
        <h1 className="text-2xl font-semibold">Apparel Art Direction Workflow</h1>
        <p className="text-sm text-muted">Production workflow: intake → review → output pack → revisions → operations → admin controls.</p>
        <div className="flex flex-wrap gap-2">
          {[
            ['intake', 'Intake'],
            ['review', 'Review'],
            ['outputs', 'Outputs'],
            ['revisions', 'Revisions'],
            ['ops', 'Ops'],
            ['admin', 'Admin']
          ].map(([key, label]) => (
            <Button key={key} className={activeModule === key ? '' : 'bg-transparent text-foreground'} onClick={() => setActiveModule(key as typeof activeModule)}>
              {label}
            </Button>
          ))}
        </div>
        <Badge>Status: {status}</Badge>
      </Card>

      {activeModule === 'intake' ? (
        <>
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">Rough Prompt Input + Autofill</h2>
            <Textarea
              rows={5}
              value={state.roughPrompt}
              onChange={(e) => setState((prev) => ({ ...prev, roughPrompt: e.target.value }))}
              placeholder="Paste rough request including project type, audience, style, production notes, constraints, and deliverables."
            />
            <div className="flex gap-2">
              <Button onClick={applyAutofill}>Prompt-to-Form Autofill</Button>
              <Button className="bg-transparent text-foreground" onClick={() => lockAll(true)}>
                Lock All
              </Button>
              <Button className="bg-transparent text-foreground" onClick={() => lockAll(false)}>
                Unlock All
              </Button>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">Multi-Step Intake</h2>
            <div className="flex flex-wrap gap-2">
              {intakeSteps.map((step, idx) => (
                <button
                  key={step.key}
                  className={`rounded-full border px-3 py-1 text-xs ${idx === state.currentStep ? 'border-primary' : 'border-border text-muted'}`}
                  onClick={() => setState((prev) => ({ ...prev, currentStep: idx }))}
                  type="button"
                >
                  {idx + 1}. {step.title}
                </button>
              ))}
            </div>
            <Card className="space-y-2 bg-[#0d1320]">
              <h3 className="font-medium">{currentStep.title}</h3>
              {currentStep.fields.map((field) => (
                <label key={field.key} className="block space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted">{field.label}</span>
                    <div className="flex items-center gap-2">
                      {confidenceBadge(field.key)}
                      <Button className="w-auto bg-transparent text-foreground" onClick={() => toggleLock(field.key)} type="button">
                        {state.locks[field.key] ? 'Unlock' : 'Lock'}
                      </Button>
                    </div>
                  </div>
                  {field.key === 'projectType' ? (
                    <Select value={state.data[field.key]} onChange={(e) => updateField(field.key, e.target.value)} disabled={!!state.locks[field.key]}>
                      <option value="Event Art">Event Art</option>
                      <option value="Tourist/Retail Art">Tourist/Retail Art</option>
                    </Select>
                  ) : (
                    <Input
                      value={state.data[field.key]}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      disabled={!!state.locks[field.key]}
                      placeholder={field.placeholder || ''}
                    />
                  )}
                  {field.helper ? <p className="text-xs text-muted">{field.helper}</p> : null}
                </label>
              ))}
            </Card>

            {currentStep.key === 'referenceUploads' ? (
              <Card className="space-y-2 bg-[#0d1320]">
                <h4 className="font-medium">Reference Upload Handling</h4>
                <Input type="file" multiple accept="image/*,.pdf" onChange={(e) => handleReferenceUpload(e.target.files)} />
                <ul className="space-y-2 text-sm">
                  {state.references.length === 0 ? <li className="text-muted">No reference files uploaded.</li> : null}
                  {state.references.map((ref) => (
                    <li key={ref.id} className="rounded border border-border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span>{ref.name}</span>
                        <Button className="w-auto bg-transparent text-foreground" onClick={() => removeReference(ref.id)} type="button">
                          Remove
                        </Button>
                      </div>
                      <p className="text-xs text-muted">{ref.type} • {Math.round(ref.size / 1024)} KB</p>
                      <Input value={ref.note} onChange={(e) => updateReferenceNote(ref.id, e.target.value)} placeholder="Reference note" />
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            <div className="flex justify-between">
              <Button
                className="bg-transparent text-foreground"
                onClick={() => setState((prev) => ({ ...prev, currentStep: clampStep(prev.currentStep - 1) }))}
                disabled={state.currentStep === 0}
              >
                Previous
              </Button>
              <Button onClick={() => setState((prev) => ({ ...prev, currentStep: clampStep(prev.currentStep + 1) }))} disabled={state.currentStep === intakeSteps.length - 1}>
                Next
              </Button>
            </div>
          </Card>
        </>
      ) : null}

      {activeModule === 'review' ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Structured Brief Review</h2>
          <div className="rounded border border-amber-700 bg-amber-950/30 p-3 text-sm">
            <strong>Missing-field warnings:</strong>
            <ul className="mt-1 list-disc pl-4">
              {missingWarnings.length === 0 ? <li>None. Required fields complete.</li> : missingWarnings.map((msg) => <li key={msg}>{msg}</li>)}
            </ul>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {intakeSteps.map((step) => (
              <Card key={step.key} className="space-y-1 bg-[#0d1320]">
                <h3 className="font-medium">{step.title}</h3>
                {step.fields.map((field) => (
                  <p key={field.key} className="text-sm">
                    <span className="text-muted">{field.label}:</span> {state.data[field.key] || '—'} {state.locks[field.key] ? '🔒' : ''}
                  </p>
                ))}
              </Card>
            ))}
          </div>
        </Card>
      ) : null}

      {activeModule === 'outputs' ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Prompt Builder Outputs</h2>
          <div className="flex gap-2">
            <Button onClick={() => buildOutputs()}>Build Full Prompt Pack</Button>
            <Badge>Branching: {state.data.projectType}</Badge>
          </div>
          {outputKeys.map((key) => (
            <Card key={key} className="space-y-1 bg-[#0d1320]">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{key}</h3>
                <Badge>{state.outputs[key] ? 'Generated' : 'Pending'}</Badge>
              </div>
              <pre className="whitespace-pre-wrap text-xs">{state.outputs[key] || 'Not generated yet.'}</pre>
            </Card>
          ))}
        </Card>
      ) : null}

      {activeModule === 'revisions' ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Structured Feedback + Revisions</h2>
          <div className="grid gap-2 md:grid-cols-3">
            <Select value={feedbackCategory} onChange={(e) => setFeedbackCategory(e.target.value as RevisionCategory)}>
              {feedbackCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
            <Input className="md:col-span-2" value={feedbackNote} onChange={(e) => setFeedbackNote(e.target.value)} placeholder="Add structured feedback note" />
          </div>
          <div className="flex gap-2">
            <Button onClick={addFeedbackChip}>Add Feedback Chip</Button>
            <Button className="bg-transparent text-foreground" onClick={applyRevision}>
              Apply Revision + Rebuild
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.feedback.length === 0 ? <p className="text-sm text-muted">No feedback chips yet.</p> : null}
            {state.feedback.map((chip) => (
              <span key={chip.id} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
                <strong>{chip.category}</strong>
                <span>{chip.note}</span>
                <button onClick={() => removeFeedbackChip(chip.id)} type="button">
                  ✕
                </button>
              </span>
            ))}
          </div>

          <Card className="space-y-2 bg-[#0d1320]">
            <h3 className="font-medium">Targeted Edit Prompt Builder</h3>
            <div className="grid gap-2 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm text-muted">Edit mode</span>
                <Select value={editMode} onChange={(e) => setEditMode(e.target.value as EditMode)}>
                  {editModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                <span className="mb-1 block text-sm text-muted">Target output section</span>
                <Select value={targetSection} onChange={(e) => setTargetSection(e.target.value as PromptOutputKey)}>
                  {outputKeys.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <Input value={targetGoal} onChange={(e) => setTargetGoal(e.target.value)} placeholder="Edit goal" />
            <Textarea rows={3} value={targetConstraints} onChange={(e) => setTargetConstraints(e.target.value)} placeholder="Edit constraints" />
            <Button onClick={buildTargetedEdit}>Build Targeted Edit Prompt</Button>
            <pre className="whitespace-pre-wrap text-xs">{targetedPrompt || 'No targeted edit prompt generated yet.'}</pre>
          </Card>
        </Card>
      ) : null}

      {activeModule === 'ops' ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Version History + Business Presets</h2>
          <h3 className="font-medium">Versions</h3>
          <ul className="space-y-2 text-sm">
            {state.versions.length === 0 ? <li className="text-muted">No saved versions yet.</li> : null}
            {state.versions.map((version) => (
              <li key={version.id} className="flex items-center gap-2 rounded border border-border p-2">
                <Badge>{version.id}</Badge>
                <span>{new Date(version.timestamp).toLocaleString()}</span>
                <span className="text-muted">{version.note}</span>
                <Button className="ml-auto w-auto bg-transparent text-foreground" onClick={() => restoreVersion(version.id)}>
                  Restore
                </Button>
              </li>
            ))}
          </ul>

          <h3 className="font-medium">Presets</h3>
          <div className="flex flex-wrap gap-2">
            <Select className="max-w-sm" value={presetName} onChange={(e) => setPresetName(e.target.value)}>
              {Object.keys(state.presets).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <Button onClick={loadPreset}>Load Preset</Button>
          </div>
        </Card>
      ) : null}

      {activeModule === 'admin' ? (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Admin Settings (Editable Hidden System Behavior)</h2>
          <label>
            <span className="mb-1 block text-sm text-muted">Safety mode</span>
            <Select
              value={state.admin.safetyMode}
              onChange={(e) =>
                setState((prev) => ({ ...prev, admin: { ...prev.admin, safetyMode: e.target.value as WorkflowState['admin']['safetyMode'] } }))
              }
            >
              <option value="balanced">Balanced</option>
              <option value="conservative">Conservative</option>
              <option value="experimental">Experimental</option>
            </Select>
          </label>
          {(Object.keys(state.admin.hiddenSystemBehavior) as Array<keyof WorkflowState['admin']['hiddenSystemBehavior']>).map((key) => (
            <label key={key}>
              <span className="mb-1 block text-sm capitalize text-muted">{key}</span>
              <Textarea
                rows={3}
                value={state.admin.hiddenSystemBehavior[key]}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    admin: {
                      ...prev.admin,
                      hiddenSystemBehavior: { ...prev.admin.hiddenSystemBehavior, [key]: e.target.value }
                    }
                  }))
                }
              />
            </label>
          ))}
        </Card>
      ) : null}
    </main>
  );
}
