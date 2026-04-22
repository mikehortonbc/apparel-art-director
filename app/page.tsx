'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  buildBasePrompt,
  buildPromptPack,
  clampStep,
  intakeSteps,
  makeDefaultState,
  outputKeys,
  parsePromptToForm
} from '@/lib/workflow';
import { PromptOutputKey, WorkflowState } from '@/types/workflow';

const STORAGE_KEY = 'aad_workflow_v3';

export default function Page() {
  const [state, setState] = useState<WorkflowState>(() => makeDefaultState());
  const [isHydrated, setIsHydrated] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [targetSection, setTargetSection] = useState<PromptOutputKey>('master');
  const [targetGoal, setTargetGoal] = useState('');
  const [targetConstraints, setTargetConstraints] = useState('');
  const [targetedPrompt, setTargetedPrompt] = useState('');
  const [presetName, setPresetName] = useState('Streetwear Drop');
  const [newPresetName, setNewPresetName] = useState('');
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
        data: { ...fallback.data, ...(parsed.data ?? {}) },
        locks: parsed.locks ?? {},
        feedback: parsed.feedback ?? [],
        outputs: { ...fallback.outputs, ...(parsed.outputs ?? {}) },
        versions: parsed.versions ?? [],
        presets: { ...fallback.presets, ...(parsed.presets ?? {}) },
        admin: { ...fallback.admin, ...(parsed.admin ?? {}) },
        currentStep: clampStep(parsed.currentStep ?? 0)
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
  }, [state, isHydrated]);

  const currentStep = intakeSteps[clampStep(state.currentStep)];
  const basePrompt = useMemo(() => buildBasePrompt(state.data, state.admin.safetyMode), [state.data, state.admin.safetyMode]);
  const lockedCount = Object.values(state.locks).filter(Boolean).length;

  const updateField = (key: string, value: string) => {
    setState((prev) => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  const toggleLock = (key: string) => {
    setState((prev) => ({ ...prev, locks: { ...prev.locks, [key]: !prev.locks[key] } }));
  };

  const lockAll = (isLocked: boolean) => {
    setState((prev) => ({
      ...prev,
      locks: Object.fromEntries(Object.keys(prev.data).map((k) => [k, isLocked]))
    }));
    setStatus(isLocked ? 'All intake fields locked.' : 'All intake fields unlocked.');
  };

  const applyAutofill = () => {
    setState((prev) => ({
      ...prev,
      data: parsePromptToForm(prev.roughPrompt, prev.locks, prev.data)
    }));
    setStatus('Autofill complete. Locked fields were preserved.');
  };

  const buildOutputs = (note?: string) => {
    setState((prev) => {
      const outputs = buildPromptPack(prev);
      return { ...prev, outputs };
    });

    if (note) saveVersion(note);
    setStatus('Prompt pack generated.');
  };

  const saveVersion = (note: string) => {
    setState((prev) => ({
      ...prev,
      versions: [
        {
          id: crypto.randomUUID().slice(0, 8),
          timestamp: new Date().toISOString(),
          note,
          data: { ...prev.data },
          outputs: { ...prev.outputs },
          feedback: [...prev.feedback]
        },
        ...prev.versions
      ]
    }));
  };

  const addFeedback = () => {
    if (!feedbackInput.trim()) return;
    setState((prev) => ({ ...prev, feedback: [...prev.feedback, feedbackInput.trim()] }));
    setFeedbackInput('');
    setStatus('Feedback note added.');
  };

  const removeFeedback = (index: number) => {
    setState((prev) => ({ ...prev, feedback: prev.feedback.filter((_, i) => i !== index) }));
  };

  const applyRevision = () => {
    setState((prev) => {
      const outputs = buildPromptPack(prev);
      return {
        ...prev,
        outputs,
        versions: [
          {
            id: crypto.randomUUID().slice(0, 8),
            timestamp: new Date().toISOString(),
            note: 'revision from feedback',
            data: { ...prev.data },
            outputs,
            feedback: [...prev.feedback]
          },
          ...prev.versions
        ]
      };
    });
    setStatus('Revision applied and version recorded.');
  };

  const buildTargetedEdit = () => {
    if (!targetGoal.trim()) {
      setStatus('Add an edit goal before building a targeted edit prompt.');
      return;
    }

    const source = state.outputs[targetSection] || basePrompt;
    setTargetedPrompt(
      `TARGETED EDIT PROMPT\nSection: ${targetSection}\nEdit goal: ${targetGoal}\nConstraints: ${targetConstraints || 'None provided'}\n\nApply the edit to this source:\n${source}`
    );
    setStatus('Targeted edit prompt generated.');
  };

  const loadPreset = () => {
    const preset = state.presets[presetName];
    if (!preset) return;

    setState((prev) => {
      const data = { ...prev.data };
      Object.entries(preset).forEach(([key, value]) => {
        if (!prev.locks[key]) data[key] = value;
      });
      return { ...prev, data };
    });
    setStatus(`Preset "${presetName}" loaded.`);
  };

  const savePreset = () => {
    const name = newPresetName.trim();
    if (!name) {
      setStatus('Provide a preset name before saving.');
      return;
    }

    setPresetName(name);
    setNewPresetName('');
    setState((prev) => ({ ...prev, presets: { ...prev.presets, [name]: { ...prev.data } } }));
    setStatus(`Preset "${name}" saved.`);
  };

  const restoreVersion = (id: string) => {
    const version = state.versions.find((v) => v.id === id);
    if (!version) return;
    setState((prev) => ({
      ...prev,
      data: { ...version.data },
      outputs: { ...version.outputs },
      feedback: [...version.feedback]
    }));
    setStatus(`Restored version ${id}.`);
  };

  const copyOutput = async (key: PromptOutputKey) => {
    const text = state.outputs[key];
    if (!text) {
      setStatus('Nothing to copy for this output yet.');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${key} copied to clipboard.`);
    } catch {
      setStatus('Clipboard copy failed in this environment.');
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <Card className="space-y-2">
        <h1 className="text-2xl font-semibold">Apparel Creative-Direction Workflow Tool</h1>
        <p className="text-sm text-muted">Strict workflow app: prompt intake → multi-step brief → review → output pack → revisions.</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge>Stack: Next.js + TypeScript + Tailwind + shadcn-style UI</Badge>
          <Badge>Locked fields: {lockedCount}</Badge>
          <Badge>Status: {status}</Badge>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">1) Rough Prompt Input</h2>
        <Textarea
          rows={5}
          value={state.roughPrompt}
          onChange={(e) => setState((prev) => ({ ...prev, roughPrompt: e.target.value }))}
          placeholder="Describe campaign intent, product, mood, typography, channels, and constraints."
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={applyAutofill}>Prompt-to-Form Autofill</Button>
          <Button onClick={() => buildOutputs('generated from rough prompt')}>Build Prompt Pack</Button>
          <Button className="bg-transparent text-foreground" onClick={() => setState((prev) => ({ ...prev, roughPrompt: '' }))}>Clear</Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">2) Multi-step Intake Form</h2>
        <div className="flex flex-wrap gap-2">
          {intakeSteps.map((step, idx) => (
            <button
              key={step.key}
              className={`rounded-full border px-3 py-1 text-xs ${idx === state.currentStep ? 'border-primary text-foreground' : 'border-border text-muted'}`}
              onClick={() => setState((prev) => ({ ...prev, currentStep: idx }))}
              type="button"
            >
              {idx + 1}. {step.title}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">{currentStep.title}</h3>
          {currentStep.fields.map((field) => (
            <label className="block" key={field.key}>
              <span className="mb-1 block text-sm text-muted">{field.label}</span>
              <div className="flex gap-2">
                <Input
                  disabled={!!state.locks[field.key]}
                  value={state.data[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  className={state.locks[field.key] ? 'opacity-70' : ''}
                />
                <Button className="w-28 bg-transparent text-foreground" onClick={() => toggleLock(field.key)} type="button">
                  {state.locks[field.key] ? 'Unlock' : 'Lock'}
                </Button>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-between gap-2">
          <Button
            className="w-auto bg-transparent text-foreground"
            disabled={state.currentStep === 0}
            onClick={() => setState((prev) => ({ ...prev, currentStep: clampStep(prev.currentStep - 1) }))}
            type="button"
          >
            Previous
          </Button>
          <Button
            className="w-auto"
            disabled={state.currentStep >= intakeSteps.length - 1}
            onClick={() => setState((prev) => ({ ...prev, currentStep: clampStep(prev.currentStep + 1) }))}
            type="button"
          >
            Next
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">3) Review Screen</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {intakeSteps.map((step) => (
            <Card key={step.key} className="space-y-1 bg-[#0d1320]">
              <h3 className="font-medium">{step.title}</h3>
              {step.fields.map((field) => (
                <p key={field.key} className="text-sm">
                  <span className="text-muted">{field.label}:</span> {state.data[field.key] || 'Not set'} {state.locks[field.key] ? '🔒' : ''}
                </p>
              ))}
            </Card>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">4) Full Prompt Builder Outputs</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => buildOutputs()}>Build Prompt Pack</Button>
          <Button className="bg-transparent text-foreground" onClick={() => saveVersion('manual save')}>
            Save Version
          </Button>
        </div>
        <div className="space-y-3">
          {outputKeys.map((key) => (
            <Card key={key} className="space-y-1 bg-[#0d1320]">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{key}</h3>
                <div className="flex items-center gap-2">
                  <Badge>{state.outputs[key] ? 'Generated' : 'Pending'}</Badge>
                  <Button className="w-auto bg-transparent text-foreground" onClick={() => copyOutput(key)} type="button">
                    Copy
                  </Button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-slate-200">{state.outputs[key] || 'Not generated yet.'}</pre>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">5) Feedback + Revision Workflow</h2>
        <Textarea rows={3} value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} placeholder="Stakeholder feedback..." />
        <div className="flex gap-2">
          <Button onClick={addFeedback}>Add Feedback</Button>
          <Button className="bg-transparent text-foreground" onClick={applyRevision}>Apply Revision + Rebuild</Button>
        </div>
        <ul className="space-y-1 text-sm">
          {state.feedback.length === 0 ? <li className="text-muted">No feedback notes yet.</li> : null}
          {state.feedback.map((note, i) => (
            <li key={`${note}-${i}`} className="flex items-center gap-2 rounded border border-border p-2">
              <span className="flex-1">{note}</span>
              <Button className="w-auto bg-transparent text-foreground" onClick={() => removeFeedback(i)} type="button">
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">6) Targeted Edit Prompt Builder</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm text-muted">Target section</span>
            <Select value={targetSection} onChange={(e) => setTargetSection(e.target.value as PromptOutputKey)}>
              {outputKeys.map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </Select>
          </label>
          <label>
            <span className="mb-1 block text-sm text-muted">Edit goal</span>
            <Input value={targetGoal} onChange={(e) => setTargetGoal(e.target.value)} />
          </label>
        </div>
        <label>
          <span className="mb-1 block text-sm text-muted">Constraints</span>
          <Textarea rows={3} value={targetConstraints} onChange={(e) => setTargetConstraints(e.target.value)} />
        </label>
        <Button onClick={buildTargetedEdit}>Build Targeted Edit Prompt</Button>
        <pre className="whitespace-pre-wrap text-xs">{targetedPrompt || 'No targeted prompt built yet.'}</pre>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">7) Locks + Version History + Presets</h2>
        <div className="flex gap-2">
          <Button onClick={() => lockAll(true)}>Lock All</Button>
          <Button className="bg-transparent text-foreground" onClick={() => lockAll(false)}>Unlock All</Button>
        </div>

        <h3 className="font-medium">Version History</h3>
        <ul className="space-y-2">
          {state.versions.length === 0 ? <li className="text-sm text-muted">No versions saved yet.</li> : null}
          {state.versions.map((version) => (
            <li key={version.id} className="flex flex-wrap items-center gap-2 rounded border border-border p-2 text-sm">
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
          <Select className="max-w-xs" value={presetName} onChange={(e) => setPresetName(e.target.value)}>
            {Object.keys(state.presets).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </Select>
          <Button className="w-auto" onClick={loadPreset}>Load Preset</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="New preset name"
          />
          <Button className="w-auto bg-transparent text-foreground" onClick={savePreset}>Save Current as Preset</Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">8) Admin Settings</h2>
        <label>
          <span className="mb-1 block text-sm text-muted">Safety mode</span>
          <Select
            value={state.admin.safetyMode}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                admin: { ...prev.admin, safetyMode: e.target.value as WorkflowState['admin']['safetyMode'] }
              }))
            }
          >
            <option value="balanced">Balanced</option>
            <option value="conservative">Conservative</option>
            <option value="experimental">Experimental</option>
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-sm text-muted">Editable hidden typography system prompt</span>
          <Textarea
            rows={5}
            value={state.admin.typographySystemPrompt}
            onChange={(e) => setState((prev) => ({ ...prev, admin: { ...prev.admin, typographySystemPrompt: e.target.value } }))}
          />
        </label>
      </Card>
    </main>
  );
}
