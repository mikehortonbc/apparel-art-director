"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildPrimaryPrompt, buildRevisionPrompt, buildTargetedEditPrompt } from "@/lib/prompt-builder";
import { CreativeDraft, getDefaultDraft } from "@/lib/types";

const STORAGE_KEY = "apparel-art-director-draft";

function updateDraft(draft: CreativeDraft): CreativeDraft {
  return { ...draft, updatedAt: new Date().toISOString() };
}

export function AppShell() {
  const [draft, setDraft] = useState<CreativeDraft>(() => getDefaultDraft());
  const [activeStep, setActiveStep] = useState(1);

  const primaryPrompt = useMemo(() => buildPrimaryPrompt(draft), [draft]);
  const revisionPrompt = useMemo(() => buildRevisionPrompt(draft), [draft]);
  const targetedEditPrompt = useMemo(() => buildTargetedEditPrompt(draft), [draft]);

  const saveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updateDraft(draft)));
  };

  const loadDraft = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as CreativeDraft;
    setDraft(parsed);
  };

  const update = <K extends keyof CreativeDraft>(key: K, value: CreativeDraft[K]) => {
    setDraft((prev) => updateDraft({ ...prev, [key]: value }));
  };

  return (
    <main className="min-h-screen bg-slate-50/70">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Apparel Creative Direction</p>
            <h1 className="h2-display">Art Director MVP</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDraft}>Load Draft JSON</Button>
            <Button onClick={saveDraft}>Save Draft JSON</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>1) Dashboard + New Project Workspace</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="name">Project name</Label>
                <Input id="name" value={draft.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="type">Project type</Label>
                <select
                  id="type"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={draft.projectType}
                  onChange={(e) => update("projectType", e.target.value as CreativeDraft["projectType"])}
                >
                  <option value="event">Event art</option>
                  <option value="retail">Retail art</option>
                </select>
              </div>
              <div>
                <Label>Step</Label>
                <div className="flex gap-2 pt-2">
                  {[1, 2, 3].map((n) => (
                    <Button key={n} size="sm" variant={activeStep === n ? "default" : "outline"} onClick={() => setActiveStep(n)}>
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2) Rough Prompt Box</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={draft.roughPrompt}
                onChange={(e) => update("roughPrompt", e.target.value)}
                placeholder="Top-line idea: campaign moment, mood, and what the art needs to do."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3) Multi-step Intake Form</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {activeStep === 1 && (
                <>
                  <Field label="Audience" value={draft.audience} onChange={(v) => update("audience", v)} />
                  <Field label="Brand essence" value={draft.brandEssence} onChange={(v) => update("brandEssence", v)} />
                  <Field label={draft.projectType === "event" ? "Event details" : "Merchandising focus"} value={draft.productFocus} onChange={(v) => update("productFocus", v)} />
                </>
              )}
              {activeStep === 2 && (
                <>
                  <Field label="Color direction" value={draft.colorDirection} onChange={(v) => update("colorDirection", v)} />
                  <Field label="Typography mood" value={draft.typographyMood} onChange={(v) => update("typographyMood", v)} />
                  <Field label="Layout direction" value={draft.layoutDirection} onChange={(v) => update("layoutDirection", v)} />
                </>
              )}
              {activeStep === 3 && (
                <>
                  <Field label="Must keep (for revisions)" value={draft.mustKeep} onChange={(v) => update("mustKeep", v)} />
                  <Field label="Avoid" value={draft.avoid} onChange={(v) => update("avoid", v)} />
                  <Field label="Reference vibes" value={draft.referenceVibes} onChange={(v) => update("referenceVibes", v)} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4) Feedback + Revision Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Feedback" value={draft.revisionFeedback} onChange={(v) => update("revisionFeedback", v)} />
              <pre className="whitespace-pre-wrap rounded-md bg-slate-100 p-3 text-xs">{revisionPrompt}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5) Targeted Edit Prompt Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field
                label="Targeted edit scope"
                value={draft.targetedEditScope}
                onChange={(v) => update("targetedEditScope", v)}
                placeholder="e.g., headline typography only"
              />
              <Field
                label="Targeted edit instruction"
                value={draft.targetedEditInstruction}
                onChange={(v) => update("targetedEditInstruction", v)}
                placeholder="what to change and why"
              />
              <pre className="whitespace-pre-wrap rounded-md bg-slate-100 p-3 text-xs">{targetedEditPrompt}</pre>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>6) Review Screen + Prompt Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm text-muted-foreground">
                Full prompt built from rough direction + intake data + project-type logic.
              </p>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md bg-slate-100 p-3 text-xs">{primaryPrompt}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7) Admin Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Hidden typography system prompt (editable):
              </p>
              <Textarea
                value={draft.typographySystemPrompt}
                onChange={(e) => update("typographySystemPrompt", e.target.value)}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
