import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { createEmptyDraft, defaultAdminSettings, starterPresets } from './data';
import { AdminSettings, Preset, ProjectDraft, RevisionFeedback } from './types';
import {
  autofillFromRoughPrompt,
  buildMasterPrompt,
  buildRevisionPrompt,
  buildTargetedEditPrompt,
  projectTypeLabel
} from './utils';

type Tab =
  | 'dashboard'
  | 'workspace'
  | 'intake'
  | 'review'
  | 'builder'
  | 'outputs'
  | 'feedback'
  | 'history'
  | 'presets'
  | 'admin';

const DRAFT_KEY = 'aad_current_draft';
const SETTINGS_KEY = 'aad_admin_settings';
const PRESET_KEY = 'aad_custom_presets';

const downloadJson = (name: string, payload: unknown): void => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [draft, setDraft] = useState<ProjectDraft>(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return createEmptyDraft();
    try {
      return JSON.parse(raw) as ProjectDraft;
    } catch {
      return createEmptyDraft();
    }
  });

  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultAdminSettings;
    try {
      return JSON.parse(raw) as AdminSettings;
    } catch {
      return defaultAdminSettings;
    }
  });

  const [customPresets, setCustomPresets] = useState<Preset[]>(() => {
    const raw = localStorage.getItem(PRESET_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Preset[];
    } catch {
      return [];
    }
  });

  const [feedbackForm, setFeedbackForm] = useState({
    feedback: '',
    preserve: '',
    targetedArea: '',
    targetedInstruction: ''
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(adminSettings));
  }, [adminSettings]);

  useEffect(() => {
    localStorage.setItem(PRESET_KEY, JSON.stringify(customPresets));
  }, [customPresets]);

  const combinedPresets = useMemo(() => [...starterPresets, ...customPresets], [customPresets]);

  const setDraftField = <T extends keyof ProjectDraft>(key: T, value: ProjectDraft[T]) => {
    setDraft((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  };

  const updateIntake = (field: keyof ProjectDraft['intake'], value: string) => {
    if (draft.lockState.intake) return;
    setDraft((prev) => ({
      ...prev,
      intake: { ...prev.intake, [field]: value },
      updatedAt: new Date().toISOString()
    }));
  };

  const updateBuilder = (field: keyof ProjectDraft['builder'], value: string) => {
    if (draft.lockState.builder) return;
    setDraft((prev) => ({
      ...prev,
      builder: { ...prev.builder, [field]: value },
      updatedAt: new Date().toISOString()
    }));
  };

  const saveVersion = (label: string, summary: string) => {
    setDraft((prev) => {
      const snapshot = {
        id: crypto.randomUUID(),
        label,
        summary,
        createdAt: new Date().toISOString(),
        data: {
          id: prev.id,
          name: prev.name,
          type: prev.type,
          roughPrompt: prev.roughPrompt,
          intake: prev.intake,
          builder: prev.builder,
          outputs: prev.outputs,
          lockState: prev.lockState,
          revisions: prev.revisions,
          updatedAt: prev.updatedAt
        }
      };
      const versions = [snapshot, ...prev.versions].slice(0, adminSettings.maxVersionsToKeep);
      return { ...prev, versions, updatedAt: new Date().toISOString() };
    });
  };

  const generateOutputs = () => {
    const masterPrompt = buildMasterPrompt(draft, adminSettings);
    const shortPrompt = `${draft.type.toUpperCase()} | ${draft.intake.styleDirection || 'style TBD'} | ${draft.intake.typographyMood || 'typography TBD'} | ${draft.builder.layoutNotes || 'layout TBD'}`;
    setDraft((prev) => ({
      ...prev,
      outputs: {
        ...prev.outputs,
        masterPrompt,
        shortPrompt
      },
      updatedAt: new Date().toISOString()
    }));
    saveVersion('Prompt Generated', 'Generated fresh master and short prompts.');
    setActiveTab('outputs');
  };

  const addFeedbackRevision = () => {
    if (!feedbackForm.feedback.trim()) return;
    const revision: RevisionFeedback = {
      id: crypto.randomUUID(),
      ...feedbackForm,
      createdAt: new Date().toISOString()
    };

    const revisionPrompt = buildRevisionPrompt(draft, revision);
    const targetedEditPrompt = buildTargetedEditPrompt(draft, revision);

    setDraft((prev) => ({
      ...prev,
      revisions: [revision, ...prev.revisions],
      outputs: {
        ...prev.outputs,
        revisionPrompt,
        targetedEditPrompt
      },
      updatedAt: new Date().toISOString()
    }));

    saveVersion('Revision Added', 'Captured feedback and generated revision + targeted edit prompts.');

    setFeedbackForm({ feedback: '', preserve: '', targetedArea: '', targetedInstruction: '' });
    setActiveTab('outputs');
  };

  const importDraft = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as ProjectDraft;
        setDraft(parsed);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const createFromPreset = (preset: Preset) => {
    setDraft((prev) => ({
      ...createEmptyDraft(),
      name: `${preset.name} Project`,
      type: preset.type,
      intake: { ...createEmptyDraft().intake, ...preset.intake },
      builder: { ...createEmptyDraft().builder, ...preset.builder },
      updatedAt: new Date().toISOString(),
      id: prev.id
    }));
    setActiveTab('workspace');
  };

  const restoreVersion = (versionId: string) => {
    const snap = draft.versions.find((v) => v.id === versionId);
    if (!snap) return;
    setDraft({
      ...snap.data,
      versions: draft.versions,
      updatedAt: new Date().toISOString()
    });
  };

  const navTabs: Tab[] = ['dashboard', 'workspace', 'intake', 'review', 'builder', 'outputs', 'feedback', 'history', 'presets', 'admin'];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Apparel Art Director</h1>
        <p className="muted">Typography-first workflow for event and retail apparel art.</p>
        {navTabs.map((tab) => (
          <button key={tab} className={tab === activeTab ? 'nav active' : 'nav'} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </aside>

      <main className="content">
        {activeTab === 'dashboard' && (
          <section>
            <h2>Dashboard</h2>
            <div className="grid">
              <div className="card"><strong>Project:</strong> {draft.name}</div>
              <div className="card"><strong>Type:</strong> {projectTypeLabel(draft.type)}</div>
              <div className="card"><strong>Versions:</strong> {draft.versions.length}</div>
              <div className="card"><strong>Revisions:</strong> {draft.revisions.length}</div>
            </div>
            <p>Last updated: {new Date(draft.updatedAt).toLocaleString()}</p>
            <button onClick={() => setDraft(createEmptyDraft())}>New Project Workspace</button>
          </section>
        )}

        {activeTab === 'workspace' && (
          <section>
            <h2>Project Workspace</h2>
            <label>Project Name</label>
            <input value={draft.name} onChange={(e) => setDraftField('name', e.target.value)} />
            <label>Project Type Logic</label>
            <select value={draft.type} onChange={(e) => setDraftField('type', e.target.value as ProjectDraft['type'])}>
              <option value="event">Event Art</option>
              <option value="retail">Retail Art</option>
            </select>
            <label>Top Rough Prompt</label>
            <textarea value={draft.roughPrompt} onChange={(e) => setDraftField('roughPrompt', e.target.value)} rows={5} />
            <div className="row">
              <button onClick={() => setDraft(autofillFromRoughPrompt(draft))}>Prompt → Form Autofill</button>
              <button onClick={() => saveVersion('Manual Save', 'Saved workspace baseline.')}>Checkpoint Version</button>
              <button onClick={() => downloadJson(`${draft.name.replace(/\s+/g, '-').toLowerCase()}-draft.json`, draft)}>Save Draft JSON</button>
              <label className="import">
                Load Draft JSON
                <input type="file" accept="application/json" onChange={importDraft} />
              </label>
            </div>
          </section>
        )}

        {activeTab === 'intake' && (
          <section>
            <h2>Multi-Step Intake Form</h2>
            <div className="row">
              <button onClick={() => setDraft((p) => ({ ...p, lockState: { ...p.lockState, intake: !p.lockState.intake } }))}>
                {draft.lockState.intake ? 'Unlock Intake' : 'Lock Intake'}
              </button>
            </div>
            {Object.entries(draft.intake).map(([key, value]) => (
              <div key={key}>
                <label>{key}</label>
                <textarea value={value} onChange={(e) => updateIntake(key as keyof ProjectDraft['intake'], e.target.value)} rows={2} />
              </div>
            ))}
          </section>
        )}

        {activeTab === 'review' && (
          <section>
            <h2>Review Screen</h2>
            <ul>
              <li>Type-specific logic: <strong>{projectTypeLabel(draft.type)}</strong></li>
              <li>Typography priority: <strong>{draft.intake.typographyMood || 'Missing'}</strong></li>
              <li>Slogan/text: <strong>{draft.intake.slogan || 'Missing'}</strong></li>
              <li>Production constraints: <strong>{draft.builder.productionSpecs || 'Missing'}</strong></li>
            </ul>
            <button onClick={generateOutputs}>Generate Prompt Outputs</button>
          </section>
        )}

        {activeTab === 'builder' && (
          <section>
            <h2>Full Prompt Builder</h2>
            <div className="row">
              <button onClick={() => setDraft((p) => ({ ...p, lockState: { ...p.lockState, builder: !p.lockState.builder } }))}>
                {draft.lockState.builder ? 'Unlock Builder' : 'Lock Builder'}
              </button>
              <button onClick={() => setDraft((p) => ({ ...p, lockState: { ...p.lockState, typography: !p.lockState.typography } }))}>
                {draft.lockState.typography ? 'Unlock Typography' : 'Lock Typography'}
              </button>
            </div>
            {Object.entries(draft.builder).map(([key, value]) => (
              <div key={key}>
                <label>{key}</label>
                <textarea
                  value={value}
                  onChange={(e) => updateBuilder(key as keyof ProjectDraft['builder'], e.target.value)}
                  rows={3}
                  disabled={key === 'typographyDirection' && draft.lockState.typography}
                />
              </div>
            ))}
            <button onClick={generateOutputs}>Build Outputs</button>
          </section>
        )}

        {activeTab === 'outputs' && (
          <section>
            <h2>Prompt Outputs</h2>
            <label>Master Prompt</label>
            <textarea value={draft.outputs.masterPrompt} readOnly rows={12} />
            <label>Short Prompt</label>
            <textarea value={draft.outputs.shortPrompt} readOnly rows={3} />
            <label>Revision Prompt</label>
            <textarea value={draft.outputs.revisionPrompt} readOnly rows={6} />
            <label>Targeted Edit Prompt</label>
            <textarea value={draft.outputs.targetedEditPrompt} readOnly rows={6} />
          </section>
        )}

        {activeTab === 'feedback' && (
          <section>
            <h2>Feedback + Revision Workflow</h2>
            <label>Feedback</label>
            <textarea value={feedbackForm.feedback} onChange={(e) => setFeedbackForm((p) => ({ ...p, feedback: e.target.value }))} rows={3} />
            <label>What must be preserved</label>
            <textarea value={feedbackForm.preserve} onChange={(e) => setFeedbackForm((p) => ({ ...p, preserve: e.target.value }))} rows={2} />
            <label>Targeted edit area</label>
            <input value={feedbackForm.targetedArea} onChange={(e) => setFeedbackForm((p) => ({ ...p, targetedArea: e.target.value }))} />
            <label>Targeted edit instruction</label>
            <textarea
              value={feedbackForm.targetedInstruction}
              onChange={(e) => setFeedbackForm((p) => ({ ...p, targetedInstruction: e.target.value }))}
              rows={2}
            />
            <button onClick={addFeedbackRevision}>Generate Revision & Targeted Edit Prompts</button>
          </section>
        )}

        {activeTab === 'history' && (
          <section>
            <h2>Version History</h2>
            {draft.versions.length === 0 ? (
              <p>No snapshots yet.</p>
            ) : (
              <div className="stack">
                {draft.versions.map((v) => (
                  <div key={v.id} className="card">
                    <strong>{v.label}</strong>
                    <p>{v.summary}</p>
                    <small>{new Date(v.createdAt).toLocaleString()}</small>
                    <button onClick={() => restoreVersion(v.id)}>Restore</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'presets' && (
          <section>
            <h2>Presets</h2>
            <div className="stack">
              {combinedPresets.map((preset) => (
                <div className="card" key={preset.id}>
                  <strong>{preset.name}</strong> <span className="pill">{preset.type}</span>
                  <button onClick={() => createFromPreset(preset)}>Use Preset</button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const newPreset: Preset = {
                  id: crypto.randomUUID(),
                  name: `${draft.name} Saved Preset`,
                  type: draft.type,
                  intake: draft.intake,
                  builder: draft.builder
                };
                setCustomPresets((p) => [newPreset, ...p]);
              }}
            >
              Save Current as Preset
            </button>
          </section>
        )}

        {activeTab === 'admin' && (
          <section>
            <h2>Admin Settings</h2>
            <label>Editable hidden typography system prompt</label>
            <textarea
              rows={6}
              value={adminSettings.hiddenTypographySystemPrompt}
              onChange={(e) =>
                setAdminSettings((prev) => ({
                  ...prev,
                  hiddenTypographySystemPrompt: e.target.value
                }))
              }
            />
            <label>Max version snapshots to keep</label>
            <input
              type="number"
              value={adminSettings.maxVersionsToKeep}
              onChange={(e) => setAdminSettings((p) => ({ ...p, maxVersionsToKeep: Number(e.target.value) || 1 }))}
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
