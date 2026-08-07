# B&C SYSTEM FORENSIC HANDOFF — FOR CODEX ARCHITECTURE AUDIT

**Prepared by:** Claude (Claude Code session, 2026-08-07)
**For:** Codex, executing `mikehortonbc/bc-flow` Issue #1 ("Architecture audit: make every order outcome-owned, self-remediating, and resumable")
**Rule observed:** No new code written. Nothing redesigned. No production system modified. No secret values reproduced anywhere in this document — credential *locations and names* only.

---

## 0. EPISTEMIC STATUS — READ THIS FIRST

Claude Code sessions do not carry memory between sessions. This document is **not** a recollection; it is a **forensic reconstruction performed today** from sources this session could actually reach:

| Source | Access | Confidence |
|---|---|---|
| `mikehortonbc/bc-flow` (cloned, full tree read) | direct | HIGH — code + 12 build-state/handoff docs read |
| `mikehortonbc/tfcu-automation` (cloned) | direct | HIGH |
| `mikehortonbc/fcc-purchase-orders` (cloned) | direct | HIGH |
| `mikehortonbc/n8n-inventory` (cloned — snapshot of the live n8n instance, dated 2026-04-17) | direct | HIGH for what existed 4/17; the instance may have changed since |
| `mikehortonbc/art-studio`, `bc-apparel-redesign`, `apparel-art-director` (cloned) | direct | HIGH |
| `mikehortonbc/employee-time-clock` | **NOT inspected** — repo attach was declined during this session | NONE — listed for completeness only |
| bc-flow Issue #1 + all 9 comments | direct | HIGH |
| Microsoft 365 (Mike's account): Teams chat list, message search, message bodies | direct | HIGH for what messages say; messages describe systems I could not open |
| **The Mac mini itself** (`fccmontana@FCCs-Mac-mini`) | **NO direct access** — this session runs in a cloud container | Everything about `~/.hermes/`, `~/.openclaw/`, launchd, and local state is reconstructed from repo docs, state JSON files, and Teams messages. Treat every Mac-mini claim as "documented, unverified on-host." |
| The Windows/WSL2 machine (`C:\Users\bcapp\...`) | NO direct access | Same caveat |
| Zoho CRM / QuickBooks / SharePoint live data | tools available but deliberately not queried beyond what the audit needed | — |

Throughout: **[CONFIRMED]** = read directly from code/docs/messages today. **[DOCUMENTED]** = asserted by a repo doc or state file but not independently verifiable from this container. **[INFERENCE]** = my judgment, labeled as such. **[MIKE 2026-08-07]** = correction supplied by Mike during this audit.

Two corrections from Mike, applied throughout:
1. **n8n is no longer in use** ("we haven't used n8n in forever"). The 2026-04-17 snapshot describes a *historical* estate. n8n is documented below as **legacy/retired**, and no claim is made that it participated in the 2026-08-06 Zoho→QBO failure. The component that actually performs (and failed) the Aug 6 Zoho→QBO integration is therefore a Mac-side Hermes script not present on GitHub — **Codex must identify it on-host** (start at `~/.hermes/scripts/` and `~/.hermes/cron/jobs.json`).
2. **Claude (across many prior sessions) architected the B&C system, and that architecture is documented in the master plan.** Those sessions' memory is not available to this session. The master plan is not in any GitHub repo and did not surface in SharePoint search; the strongest candidate location is **MikeVault on the Mac mini** — repos cite `/Users/fccmontana/Documents/MikeVault/B&C Analysis/Production Flow — Architecture + Build Plan - 2026-07-26.md`, and MikeVault's `Agent Logs/` holds the per-build design docs. **Codex should treat the MikeVault master plan as the design-intent source of record and this document as the as-built forensic record.**

---

## A. CURRENT SYSTEM MAP (how the pieces actually connect today)

```
                        CUSTOMERS / STAFF
                              │
      ┌───────────────────────┼──────────────────────────────┐
      │ Teams freehand msgs   │ Teams structured form         │ Zoho CRM (sales reps)
      │ ("B&C New Order       │ (order-intake.bcapparel.com   │
      │  Intake" chat)        │  /order-intake/new)           │
      ▼                       ▼                               ▼
┌──────────────────────────────────────────────┐   ┌──────────────────────────┐
│  BC FLOW (repo: bc-flow, name               │   │  Zoho→QBO integration     │
│  "memorial-day-square")                      │   │  (Mac-side Hermes script; │
│  RUNS ON THE MAC MINI, NOT VERCEL            │   │  exact script UNIDENTIFIED│
│  cloudflared → localhost:3100                │   │  from GitHub — this is    │
│  • launchd worker polls Teams every 60s      │   │  what failed 2026-08-06)  │
│  • AI extraction (Claude primary, OpenAI A/B)│   │  [n8n predecessor RETIRED │
│  • human review queue → Approve              │   │   per Mike]               │
│  • Approve → Zoho Account+Contact+QUOTE      │   └──────────┬───────────────┘
│    (ZOHO_WRITE_ENABLED=yes, LIVE)            │              ▼
│  • Sales Order write GATED OFF               │        QuickBooks Online
│  • /floor PWA (deployed 7/28)                │        (realm 9130351881280196)
└───────────────┬──────────────────────────────┘              ▲
                │ Supabase (pojwujeymehgxnpgzkfx)             │
                │ order_intakes / floor_queue / floor_events  │
                ▼                                             │
┌──────────────────────────────────────────────────────────────┴────────┐
│  HERMES RUNTIME ON THE MAC MINI (~/.hermes/, ~/.openclaw/)            │
│  — none of this is on GitHub —                                        │
│  • Riley (riley@bcapparel.com): teams_chat.py + ~15 watcher scripts   │
│  • Hermes cron: zoho_qbo_estimate_reconcile.py (7:20/14:20 MT)        │
│  • Hermes cron: bc_invoice_worker.py SHADOW invoicing (7:35/14:35 MT) │
│  • bc_floor_queue.py snapshot builder (6:15/12:00/15:00 MT)           │
│  • carrier_tracking.py (UPS proven, FedEx configured — read-only)     │
│  • DEMING — the GM governance agent (~/.hermes/state/deming/)         │
└───────────────────────────────────────────────────────────────────────┘

SEPARATE ESTATES:
• fcc-purchase-orders → Vercel (admin.bcapparel.com etc.) + Supabase;
  FCC = Freckles Clothing Co., Whitefish MT retail. Lightspeed X-Series.
  GitHub Actions are its cron. Mac-side eForce scrapers push into it.
• tfcu-automation → built for Windows/WSL2, squash-committed from the Mac
  mini 2026-05-06; dry-run proven, NEVER live (3 hard blockers, §4).
• Square event dashboard half of bc-flow → Vercel
  (memorial-day-square.vercel.app), sales sync cron every 15 min.
```

Key structural fact for Issue #1: **there are two disjoint Zoho→QBO paths** — the Zoho SO → QBO Estimate creator (a Mac-side Hermes component with no BC Flow linkage; its n8n predecessor is retired **[MIKE 2026-08-07]**) and the Mac-mini reconciler (exact-DocNumber match only, writes `order_intakes.qbo_estimate_id`). The 2026-08-06 failure (Zoho SO `7110943000011045006` → placeholder customer "New Account" → estimate 10899 created after manual fix but never linked in BC Flow) is exactly what this split produces: the estimate-creation path has no intake record to update, and the reconciler only backfills on exact DocNumber matches against an existing intake row. **[CONFIRMED structure; the exact failing script must be identified on the Mac mini]**

---

## 1. AUTOMATED INVOICING / QUICKBOOKS

### 1.1 Architecture in one paragraph

Estimates are created two ways (n8n webhook from Zoho; TFCU pipeline — never live). **Invoices are still created by humans in QBO.** The automation built over the last several days is a **shadow invoice worker** on the Mac mini that watches estimate→invoice conversions and scores what it *would* have done, plus a **closeout count-back ledger** in bc-flow that reads crew ink-marked work-order photos, because a measured fact drives the whole build: **0 of 28 estimate→invoice conversions in 2026 ever adjusted quantity** — customers get billed what the estimate said, not what shipped (the Duane Brown / Brown's Driving School 90-piece incident is the root-cause doc). **[CONFIRMED]**

### 1.2 Components

**NAME:** B&C Invoice Worker (shadow)
**PURPOSE:** Shadow-mode invoicing: match QBO estimates→invoices via exact `LinkedTxn`, compare tax/totals to the cent, maintain a scorecard; will become the live invoice creator only after a 10-business-day clean shadow period and explicit authorization.
**REPO/PATH:** **NOT on GitHub.** `~/.hermes/scripts/bc_invoice_worker.py` on the Mac mini. Documented in `bc-flow/INVOICING_BUILD_REPORT.md` + `INVOICING_BUILD_STATE.json`.
**PRODUCTION STATUS:** partial — shadow only. `live_mode_enabled: false`, `customer_sends: 0`, `zoho_writes: 0`. Entry point **force-sets `INVOICE_DRY_RUN=1`** even if the scheduler passes a contrary value. **[CONFIRMED from state file]**
**TRIGGER:** Hermes cron job `969c606102f1`, schedule `35 7,14 * * *` America/Denver, model `claude-opus-4-8`.
**INPUTS:** QBO API (tokens `~/.openclaw/qbo-tokens.json`), Supabase `order_intakes`.
**OUTPUTS:** `~/.hermes/state/bc_invoice_worker/SHADOW_SCORECARD.json`; once-daily one-line Teams digest that **refuses any roster other than exactly Mike Horton and Riley**.
**STATE STORAGE:** the scorecard JSON + Hermes cron output archives + MikeVault Agent Logs.
**EXTERNAL SYSTEMS:** QBO production realm `9130351881280196`.
**KNOWN FAILURES:** (resolved) macOS TCC `PermissionError` writing to MikeVault from launchd context; (noise) QBO tax-code remap `3→165` produced a `$0.00 vs $35.70` comparator flag; a "Simple Start downgrade" of the QBO subscription happened — the P5 probe suite (`~/.hermes/scripts/qbo_post_downgrade_probe.py`, 7/7 probes green, all test docs deleted-and-verified) exists to prove the API surface survived it. Runbook rule: any probe failure after the downgrade **pauses the invoice cron**. MCP connector path: SKIPPED (no callable QBO connector was reachable), not passed.
**IDEMPOTENCY:** exact LinkedTxn matching, duplicate links collapsed; cap of 5 candidates/run; no customer-send surface exists (AST-asserted by its safety suite).
**WHAT ANOTHER AGENT MUST NOT BREAK:** the dry-run force-set, the 5-candidate cap, the two-person digest roster, the probe-failure-pauses-cron rule, and the 10-day shadow clock (restarting it delays go-live).

**NAME:** Zoho↔QBO Estimate Reconciler
**PURPOSE:** Backfill/verify `order_intakes.qbo_estimate_id` by **exact DocNumber == Zoho SO_Number only**; the sole authorized writer of that column, everything else read-only.
**REPO/PATH:** `~/.hermes/scripts/zoho_qbo_estimate_reconcile.py` (Mac mini, not on GitHub). Documented in `bc-flow/JOBSHEET_IDS_STATE.json`.
**PRODUCTION STATUS:** production. **TRIGGER:** Hermes cron `20 7,14 * * *` MT, model `claude-sonnet-5`. Router protocol: first stdout line `OK:` or `DRIFT:`.
**KNOWN FAILURES:** 2 of 6 backfill targets unresolved (`dad45f91…`: no exact QBO match for DocNumber `7110943000010610021`; `769b919f…`: Zoho record id not found). Ambiguous matches deliberately write nothing — which is also why the Aug 6 order never got linked. **[CONFIRMED]**
**MUST NOT BREAK:** exact-match-only rule; single-column write scope (`other_columns_written: []`).

**NAME:** Closeout Count-Back Ledger
**PURPOSE:** OCR crew ink-marks on photographed work orders (Teams chat "ESTIMATES-INVOICES-SALES ORDERS", `19:1f61ce3e70bd41c8ae7adeb759928e1d@thread.v2`), double-read with disagreement-holds, deterministic-key estimate matching ("DETERMINISTIC KEYS DECIDE, FUZZY KEYS ONLY NOMINATE" — after `Freckles_Graphics_MT` vs `FRECKLES GRAPHIC MONTANA` nearly auto-closed ~$8K wrongly).
**REPO/PATH:** `bc-flow/lib/closeout/*`, `scripts/closeout-backfill.ts`, migration `20260726000000_closeout_ledger.sql`.
**PRODUCTION STATUS:** partial. Replay report: **14 held, 2 no-match, 0 wrong, 0 useful answers yet.** Idempotency key `(message_id, image_index, sheet_index)`.
**MUST NOT BREAK:** the disagreement-hold; deterministic-key rule.

**NAME:** In-repo QBO pieces (bc-flow): `lib/orderLedger/qboEstimate.ts` (mapping preview, **dry-run by design, makes NO QBO call**), `lib/qboEstimateRead.ts` (read-only exact-ID lookup, production), `scripts/closeout-qbo-pool.py` (estimate dumper), `scripts/p1-qbo-conversion-validation.py` (one-shot $0.01 validator, self-deleting, throwaway).

**NAME:** Zoho SO → QBO Estimate creator — see §2.1. The estimate-creation path for standard Zoho orders is a Mac-side Hermes component (unidentified from GitHub); its n8n predecessor is retired **[MIKE 2026-08-07]**.

### 1.3 How completion/production triggers invoicing

**It doesn't — anywhere, yet.** No code path in any repo fires an invoice from a production event. The designed chain is: crew ink-marks the printed estimate → photo to Teams → closeout ledger reads it → (future, unauthorized) invoice with corrected counts. `completeOrder` in `bc-flow/lib/orderLedger/fulfillment.ts` is a Supabase status transition only. `/floor` "Mark done" events trigger **nothing** downstream. **[CONFIRMED]**

### 1.4 Unresolved blockers

1. Live invoice mode not authorized (10-day shadow clock in progress as of 2026-07-28 docs).
2. Closeout replay produces holds, not answers — OCR/matching not yet trustworthy.
3. QBO MCP transport never validated (skipped).
4. The Aug 6 class of failure: estimates created outside BC Flow have no intake row to link to (Issue #1 concrete case #1).

Related live monitors (Riley, Teams-confirmed 2026-08-06): `ar_alert_delivery.py` ("A/R ABSENCE ALARM — invoices created=1, verified deliveries=0"), sales-tax intake corrector (`bc_tax_intake_corrector.py` — flagged ARVEST BANK taxable-vs-exempt mismatch, did NOT auto-flip), AR payment sweep, FCC weekly cash reconciliation (found **$11,492.16 undeposited [STALE]**). **[CONFIRMED from Teams]**

---

## 2. ZOHO → QBO

### 2.1 Path 1 — the Zoho SO → QBO Estimate creator (Mac-side; the one that failed 2026-08-06)

**[MIKE 2026-08-07]: n8n has not been used "in forever."** The current estimate-creation automation is therefore a **Mac-side Hermes component that does not appear in any GitHub repo** — Issue #1's own wording ("the automation stopped because it could not find a matching QBO customer") describes its behavior, but its script name, schedule, matching rules, and retry policy could not be identified from this session's sources. **Codex's first on-host task should be to find it:** start with `~/.hermes/cron/jobs.json`, `~/.hermes/scripts/` (siblings of `zoho_qbo_estimate_reconcile.py`), and the Hermes cron output archives. What is known about its behavior from the Aug 6 incident: it halts (rather than remediates) on a failed QBO customer match, creates no intake linkage, and raises no alert that reached anyone before Ailene noticed manually.

**The retired n8n predecessor** (documented for history and for decommission review, from the 2026-04-17 snapshot in `n8n-inventory/`): workflow "Zoho New Sales Order → QBO Estimate" (`LHlMRxb57QfVovxTGguIl`) on `https://primary-production-fdc0a.up.railway.app` (Railway, account `jake@bcapparel.com`) — Zoho webhook → find/create QBO customer → resolve lines vs QBO inventory → create Estimate; execution-log-only persistence, no write-back, no alerting. Siblings included QBO-estimate→Teams-PDF, Zoho SO print via Gotenberg, Shopvox scrape jobs (one erroring daily as of the snapshot), a Sales→Discord alert, and an idle **EC2-reboot webhook** flagged as a red flag. 18 credentials owned by jake@bcapparel.com (`n8n-inventory/CREDENTIALS.md`, names only).
**PRODUCTION STATUS:** **retired per Mike; instance liveness unverified from this container** (the outbound proxy blocked a reachability check). **Decommission review recommended:** if the Railway instance still runs, it holds live QBO/Zoho/Outlook/Teams/AWS OAuth credentials and an unauthenticated-ish EC2 reboot webhook; if its Zoho webhook subscription was never deleted, a stale duplicate estimate-creation path could still fire. Confirm it is actually off, not merely unused.

### 2.2 Path 2 — BC Flow (human-gated)

Read-only matcher `lib/zohoCustomerMatcher.ts` (email-exact → green; multi-match → yellow human review). Approve → `lib/zohoWriteClient.ts` creates Account + Contact + **Quote only** (SO deliberately deferred to "Mark quote accepted"; changed 2026-07-23 at Mike's ask). Gate `ZOHO_WRITE_ENABLED=yes` is **ON**; `BC_FLOW_SO_WRITE_ENABLED` is **OFF**; `BC_FLOW_GO_LIVE_AFTER` protects the historical book. Idempotency: `BCF<16-char>` tag embedded in Quote Subject + pre-create search; atomic `claimApprovalRow` CAS against double-approve; fail-closed `findFirstId` (non-200 throws rather than duplicating). Known residual risks (from `CODEX_REVIEW_HANDOFF.md`, 2026-06-13): no retry/backoff on 429 (approve simply fails), Approve+Reject race can leave a Quote on a rejected order, crash window can leave "approved with no Quote" (recover via Reopen). **[CONFIRMED]**

### 2.3 The linkage hole (root cause for Issue #1 case 1)

Path 1 knows nothing about `order_intakes`. Path 2 stops at Quote. The reconciler only links **exact** DocNumber matches to **existing** intake rows. An order that enters via Zoho directly (sales rep) and fails in the estimate creator produces: no intake record, no estimate, no alert, no retry — a human notices or nobody does. **[CONFIRMED structure]**

---

## 3. PRODUCTION FLOW

### 3.1 The floor interface Mike referenced in Issue #1 comment 1 — it exists and is deployed

**NAME:** BC Floor PWA (`/floor`)
**PURPOSE:** One-job-per-screen pager for operators: approved proof, ink/placement/garment/method, size grid, cross-lane handoff line, tri-state delivery banner, **Mark done**.
**REPO/PATH:** `bc-flow/app/floor/*`, `lib/floor/*`, `public/floor/sw.js` (offline queue).
**PRODUCTION STATUS:** **production — live at order-intake.bcapparel.com/floor since 2026-07-28 ~06:45 MT** (`FLOOR_BUILD_STATE.json: "DEPLOYED"`). Remaining: iPad home-screen installs + first sign-ins. As of 2026-07-28, `floor_events` had **0 rows** — deployed, not yet used. **[CONFIRMED]**
**AUTH:** Entra ID OIDC (tenant `9a0c992d-…`, app "BC Floor" `93bb216e-…`), HMAC session cookie, allowlist: Eric, Caritina, Brittany, Jamie, mike.horton, chito. (`ericartwork@` is DEPARTED and must never appear in artifacts — but note that account is still present in several Teams chats.)
**ROUTING (`lib/floor/routing.ts`):** Eric → screenprint lane; **Caritina → embroidery-and-more lane** (Embroidery / DTF / Rhinestone / Twill sew / Other, embroidery batched by thread colour); Brittany+Jamie → prep lane; Mike+Chito → everyone view; ambiguous jobs land in a visible **"UNROUTED — ask Chito"** bucket, never guessed.
**OPERATOR UPDATE FLOW:** Mark done → `POST /api/floor/events` (session-checked, person-scoped, 409 if stage blocked: "Waiting on cut twill from Brittany — do not start") → append `floor_events`.
**DOWNSTREAM TRIGGERS: none.** No invoicing, Zoho write, or notification fires from a floor event. **[CONFIRMED]**
**JOB SOURCE:** single-row `floor_queue` snapshot published by `~/.hermes/scripts/bc_floor_queue.py` (Mac mini; 06:15/12:00/15:00 MT + 06:45 wrapper), admission = Zoho SO status exactly `Approved` or admitted `SVC-*`; atomic upsert with read-back verification; append-only departure trace.
**MUST NOT BREAK:** the hard regression contract — every pre-existing bc-flow route must answer exactly as before, unauthenticated (proxy matcher covers `/floor` + `/api/floor` ONLY); the snapshot atomicity; the "never fake green" delivery banner.

### 3.2 What is deployed vs unfinished (per state files, all [CONFIRMED])

| Piece | State |
|---|---|
| `/floor` PWA + auth + routing | DEPLOYED 7/28 |
| Delivery banner (`lib/floor/delivery.ts`) | code done, **blocked_on_mike** — **0 of 24 live jobs joinable to a vendor PO**; the identifier "does not exist anywhere" upstream; fix is business-process (type `BC-####` into the SanMar/S&S PO field at checkout). Candidate links await `floor_delivery_link_confirm.py --by mike` |
| Floor accounting / order-status spine (Packet 4) | **verified but never released** — `launchctl kickstart com.bcapparel.order-intake-app` returned "Operation not permitted"; production still serves the pre-Packet-4 build; Vercel fallback explicitly refused |
| Routing packet R3 | blocked — BC-0153 (style ST485) has no exact precedent and the exact-style rule was not weakened |
| Art approval loop | hard dry-run (send scripts refuse to run if enable flags are set); coverage 2/26 jobs |
| `/order-intake/production` queue page (loop #3, Brittany/Eric/Caritina by stage) | in repo, part of the app |

### 3.3 Where production-floor truth actually lives today

Zoho SO status (`Approved` → floor queue; `Production_status` field written by bc-flow cart flow), the floor snapshot, `floor_events` (empty), Teams chats "WITH CARTINA ( EMBROIDERY)" and "WITH ERIC ( SCREENPRINT)" (human coordination — this is where TFCU replacement work was being assigned manually on 2026-08-07), and Riley's watchers (changed-order watchman flags "STALLED (not decorated): 15 business days"). **[CONFIRMED]**

---

## 4. TFCU / ORDERMYGEAR

### 4.1 tfcu-automation pipeline

**NAME:** TFCU order orchestrator (`agent_tfcu_v1`)
**PURPOSE:** OMG employee-store order → SKU map → SanMar inventory check → 5-rule anomaly approval (Teams Adaptive Cards, `/tfcu approve|reject`) → SanMar `SendPO` (UPS GROUND default) → QBO Estimate (customer "Tinker Federal Credit Union") → SharePoint Excel master ledger fan-out → Teams notify. Pipeline **ends at Estimate**; invoicing = human types invoice # into the ledger; hourly `poll_invoices.py` flips DB status to `invoiced`.
**REPO/PATH:** `tfcu-automation/orchestrator/*`; DB migrations `tfcu-automation/db/migrations/*` (Supabase: `tfcu_orders`, `tfcu_order_events`, `tfcu_sku_map`, `tfcu_agent_decisions`(unused), `run_mode` dry_run/live column with per-mode idempotency).
**PRODUCTION STATUS:** **partial — dry-run proven (2026-04-23 and 2026-04-28 artifacts), NEVER live.** Live pilot (order `ord_184622389`) hard-gated behind `SANMAR_SENDPO_PROVISIONED=true` and "Do not run until Mike explicitly approves."
**HARD BLOCKERS [CONFIRMED from docs/todos/]:**
1. SanMar SendPO error `999 "Customer FTP folder does not exist"` — TPI account **300135** not provisioned.
2. `QBO_CLIENT_ID`/`QBO_CLIENT_SECRET` missing from `.env` (retrieve from the **HermesBC** app at developer.intuit.com).
3. Three OMG Pop-up API fields unmapped: **employee name (null in every test pull), coupon $, overage $** — direct inputs to anomaly rules 3–4; support email to sean.mitton@ordermygear.com drafted 2026-04-29, unanswered in repo.
**SILENT-DEGRADATION RISK:** missing config swaps in stubs — no `DATABASE_URL` → stdout-only event sink (**no idempotency → duplicate SanMar POs possible**); no `SANMAR_PASSWORD` → inventory checker returns hardcoded 100,000 available. Warnings only, no halt. `VERIFY_SSL=False` on SanMar SOAP.
**DEAD CODE:** entire batching state machine + 9-warehouse allocator + Telegram trigger layer — orphaned when the spec pivoted to Teams.
**ARCH DRIFT:** spec says "Stay on Maton gateway, no Intuit OAuth work"; shipped code does direct Intuit OAuth (`~/.openclaw/qbo-tokens.json`). `.env.example` still documents the dead Maton path.
**SECURITY FINDING (locations only):** a **plaintext SanMar password sits in tracked files** — `CODEX-HANDOFF.md:54`, `docs/TFCU-AUTOMATION-SPEC.md:110`, `SCOPE.md:207`, `docs/MIKE-MORNING-BRIEF.md:47`; `CODEX-HANDOFF.md:55` also carries a default webhook token. The repo has a GitHub remote. Should be rotated and scrubbed (do not do this mid-audit without Mike).
**RA/RETURNS:** explicitly out of scope in v1 (`SCOPE.md:372`). **No RA code exists anywhere.** The SanMar RA work happens in the Teams chat "SanMar RA — TFCU Extras" + a spreadsheet (Issue #1 comments 4–6). Riley detected ~55 RA units matching garments still owed on open orders — detection only, no reconciliation worklist exists.
**MUST NOT BREAK:** `run_mode` idempotency scoping; the DRY_RUN kill switch; the SharePoint ledger schema (20 columns, 4 human-entered: `fedex_tracking` (Chito), `date_shipped_tfcu`, `qbo_invoice_id` (Ailene), `date_invoiced`); "DB is source of truth" rule.

### 4.2 The April→August aged-order failure (Issue #1 case 2) — what actually watches TFCU today

Because the orchestrator never went live, TFCU order state lives in: OMG itself, the SharePoint ledger, and **Riley's watchers on the Mac mini** (none in any repo) — `tfcu_decoration_watcher.py` (watches Stefanie's emails, escalates missing-decoration complaints), `tfcu_changed_watchman.py` ("STALLED (not decorated): #186853366 — 15 business days since garment ordered, OMG line not Complete"), swap runs (handled Joanna Flores' "do you still have my order" email end-to-end minus a $2.00 refund decision), eForce ingest SLA watcher (found MAI-500 stuck **49 days**). These watchers **detect and report to Mike's 1:1; they do not remediate** — precisely the detect-without-own gap Issue #1 names. The Nathan Dyer / Deanndra Emanuel replacement promises were being manually fanned out by Mike in the Caritina chat on 2026-08-07 10:35. **[CONFIRMED from Teams]**

### 4.3 FCC (Freckles Clothing Co.) — the *other* store estate, easily confused with TFCU

`fcc-purchase-orders` (Vercel + Supabase) is the Whitefish MT retail estate: Holly's PO workflow (idempotent submit validated live 5/29 — status `failed_with_consignment` means "resume, never recreate"), reorder engine, Lightspeed sync via GitHub Actions cron (10-min products, hourly sales; **sync-received has no scheduler**), eForce↔Lightspeed invoice reconciliation (to-the-penny basis + 7% Indiana tax), OOS/transfer/print sheets (active work through PR #48, Aug 5). Agent autonomy schema (`agents`, `agent_autonomy_settings`, `agent_penelope_v1` planned) ships live but **empty — `/api/agent/*` handlers don't exist**. Supabase is on the **free tier with 7-day pause risk** for an app Holly depends on. `appsData.tsx` is the best single cross-estate map in any repo. **[CONFIRMED]**

---

## 5. RILEY / AGENT AUTOMATION

### 5.1 What Riley actually is

**Riley is a full Microsoft 365 identity — `riley@bcapparel.com`, Azure app `182b4634-71f6-4f58-82b5-ef42b602602b`, bot endpoint `riley-mac.bcapparel.com`** — driven by Python scripts under `~/.hermes/` on the Mac mini (formerly `~/.openclaw/` on the Windows/WSL2 `bcapp` machine; the Hermes systemd service "Riley runs here" per tfcu SCOPE.md, migrated to the Mac ~2026-05-06). Riley is a member of at least 12 operational Teams chats [CONFIRMED from chat rosters]: Caritina/embroidery, Eric/screenprint, Shipping, ESTIMATES-INVOICES-SALES ORDERS, B&C New Order Intake, OMG Store Orders from Emails, SanMar RA — TFCU Extras, Light Speed 2026, sales-team chats, and a 1:1 with Mike that functions as the operational alert bus.

### 5.2 teams_chat.py

`~/.hermes/skills/teams_chat.py` — the send/receive skill (`python3 ~/.hermes/skills/teams_chat.py send <chat_id> "<text>"`, referenced by `bc-flow/scripts/intake-autofix.prompt.md:87`). Most Riley messages carry the stamp `[agent-provenance:v1 script=teams_chat.py run=<uuid>]`; single-purpose watchers stamp their own script name. **[CONFIRMED from live Teams messages]**

### 5.3 The scheduled fleet (script names harvested from provenance stamps + repo docs; all Mac mini, none on GitHub)

`master_director.py` (daily "Master Director" brief: AR position, reorder windows, chartered-outbound status) · `ar_alert_delivery.py` · `bc_tax_intake_corrector.py` · `tfcu_decoration_watcher.py` · `tfcu_changed_watchman.py` · `vendor_receiving_digest.py` (SanMar + S&S order-history APIs) · `fcc_transfer_slip_watchdog` (87 abandoned OPEN slips at go-live) · FCC Reorder Watchman · FCC weekly cash reconciliation · FCC floor-inventory drift alert · eForce ingest SLA watcher · "Open Loops" shift reports (13:30/17:30 CDT) · AR payment sweep · swap runs · plus bc-flow launchd watchers that post as Riley (`order-intake-fidelity-watch.ts` hourly, `order-intake-issue-watch.ts`, `order-intake-review-health.ts`, staleness digest 08:00). Riley research sub-agents run on Anthropic models (one "died on the Anthropic monthly spend limit" 7/22). **[CONFIRMED]**

### 5.4 What Riley can do autonomously vs report

- **Read:** Teams, mailboxes it monitors (customer emails, Stefanie/TFCU, vendor portals via scrapers), OMG, QBO, Zoho, Lightspeed, SanMar/S&S APIs, bank-deposit data (stale to 7/17), Supabase.
- **Write autonomously:** Teams messages/alerts; state files; drafts staged to disk.
- **Gated:** customer-facing sends and money movement sit in a **Veto Queue** (e.g., the Loloa/BancFirst reply sat drafted-and-unvetoed from 7/28 until its portal deadline **expired 8/6** — a concrete cost of the veto model). Collections is "tier-0 observe-only." AR dunning/write-offs executed 8/2–8/3 were each individually released by Mike in chat ("blake is a right off", "send it").
- **State:** `~/.hermes/state/*` (intake-issues.jsonl, vendor_orders ledgers, floor_queue, ar_thankyou_drafts, deming/...), `~/.openclaw/*` token files, MikeVault Agent Logs.
- **Escalation:** everything lands in Mike's 1:1; "needs a human eye — nothing sent, nothing ordered" is the standard stop.

### 5.5 The nightly self-repair agent

`bc-flow/scripts/intake-autofix.sh` runs headless `claude -p … --permission-mode bypassPermissions --max-budget-usd 8` (model opus) to drain the intake issue queue, fix, test, build, commit, **push**, kickstart the app, and brief Mike — with STOP conditions (dirty tree, red tests, no work). Whether it is currently scheduled is **unknown** (no launchd label in DEPLOY.md), and its `git push` directly contradicts DEPLOY.md's "never `git push`" rule. **[CONFIRMED code; UNKNOWN schedule]**

---

## 6. FEDEX / UPS

- **No carrier API code exists in any GitHub repo.** [CONFIRMED by search]
- **What exists on the Mac mini [DOCUMENTED in bc-flow FLOOR_DELIVERY_PLAN.md]:** `~/.hermes/skills/carrier_tracking.py` — `track(carrier, number)`, read-only; **"FedEx configured, UPS proven 2026-07-26."** Credentials at `~/Secrets_Quarantine/ups.env` and `~/Secrets_Quarantine/fedex_api.env` (names/locations only).
- **Label creation:** none live. A UPS label/rate integration was in progress: migration `20260726000000_closeout_ledger.sql:178` — *"day UPS approval (shipper `24XW02`, error `182279`) lands, the label call has a…"* — i.e., **UPS shipper-account approval was pending with an open error 182279**. Production readiness: NOT STARTED for labels, PARTIAL for tracking reads.
- **Schema ready:** `vendor_purchase_orders(carrier, tracking_number)`, `customer_shipments(carrier, tracking_number, status: label→shipped→in_transit→delivered, qty for split shipments)` — deterministic/internal only; UI is **manual carrier+tracking entry** (`fulfillmentActions.ts`).
- **Existing feeds:** `fedex_tracking_sync.py` is an **outbound** ship-history scraper (B&C's own labels to TFCU recipients) — repo docs explicitly warn it must not be treated as an inbound-blanks feed. Inbound visibility comes from vendor ledgers `~/.hermes/state/vendor_orders/sanmar_orders.json` (71 records, UPS tracking) and `ss_orders.json` (713 records). SanMar OSN refuses queries older than 7 days (measured fault `303`).
- **Webhooks/polling:** polling only; no carrier webhooks anywhere.
- **The blocking dependency is human, not technical:** delivery-banner joins are 0/24 because **no one types the BC job number into the SanMar/S&S PO field at checkout** — vendor ledgers show free-text POs like `'FIRE MARSHAL SHIRT'`, `'6/9/2026'`; 0 of 784 vendor PO strings exact-match a job. **[CONFIRMED]**

---

## 7. MAC MINI INFRASTRUCTURE

Host: `FCCs-Mac-mini.local`, user `fccmontana`. **Production for order intake is this machine, not Vercel** (`DEPLOY.md:3`). `.env.local` IS production config. Public via cloudflared tunnels: `order-intake.bcapparel.com` → :3100; `riley-mac.bcapparel.com` → Riley.

**launchd (`~/Library/LaunchAgents/`):** `com.bcapparel.order-intake-worker` (60s Teams poll — **runs from source, so an uncommitted edit is live within a minute**) · `-app` (built Next.js, :3100) · `-tunnel` (cloudflared) · `-staleness` (daily 08:00) · `-fidelity` (hourly 08:15–18:15) · `-fidelity-weekly` (Mon 08:05); plus tunnel-autosync and (possibly) intake-autofix.

**Hermes cron (`~/.hermes/cron/jobs.json`):** reconciler 7:20/14:20 MT · invoice worker (shadow) 7:35/14:35 MT · floor snapshot builders 06:15/12:00/15:00 + 06:45 wrapper · fcc_transfer_slip_watchdog · the Riley watcher fleet (§5.3) · `bc_process_watchman.py` watches the watchers.

**Local-only repos/dirs:** `/Users/fccmontana/Projects/square implementation` (= bc-flow production checkout; **"Local commits only — never git push"** → **GitHub is guaranteed stale**: last push 2026-07-29, daily local commits since are invisible to Codex) · `/Users/fccmontana/Projects/tfcu-automation` · `~/.hermes/` (scripts, skills, state, cron — **none on GitHub**) · `~/.openclaw/` (token files) · `~/Secrets_Quarantine/` · `/Users/fccmontana/Documents/MikeVault/` (Agent Logs; the master floor spec "Production Flow — Architecture + Build Plan - 2026-07-26.md" lives here, not in git).

**Environment failure modes [CONFIRMED from state files]:** macOS TCC/Full Disk Access blocks vault writes from launchd (twice hit; scripts deliberately write to `~/.hermes/state` instead) · `launchctl kickstart` "Operation not permitted" left Packet 4 verified-but-undeployed · Graph refresh-token **rotation race**: bc-flow worker shares `~/.openclaw/riley-msgraph-tokens.json` with Riley/OpenClaw; when Riley's bridge dies everything 401s (break-glass: `refresh_riley_token.py`, `riley_device_code_signin.py` — the latter referenced by bc-flow but not present in it). Backups: nightly restic→B2; `npm run build` is destructive in place.

**A second machine matters:** the Windows box (`C:\Users\bcapp\.openclaw\...`) hosted the original Hermes/WSL2 runtime and generated the n8n snapshot; RESUME-NOTES records it physically moved store→Mike's home 2026-04-18. Whether anything still runs there is **UNKNOWN**.

---

## 8. OTHER HIDDEN / SIDE SYSTEMS

| System | What/where | Status |
|---|---|---|
| **SharePoint TFCU master ledger** | Excel table `TFCU_Orders`, written via Graph app-only creds (`hermes-azure-creds.env`); humans type invoice #s and FedEx tracking into it | production-designated; 423-Locked when Ailene/Sherry Mae have it open |
| **TFCU RA spreadsheet** | referenced in Issue #1 comments; lives outside all repos | active, manual |
| **MikeVault** (`~/Documents/MikeVault/`) | Agent Logs, root-cause docs, the floor architecture spec, Deming adjudications | active; TCC-guarded |
| **Teams-as-workflow** | mock-up request chats (artists post "Complete:" lists), "OF and Mock up", "ZOHO-QB / ORDERING LENIE/AILENE" (active 8/6), TIMECARD/SYSTEM ISSUE REPORT | the de-facto WIP system |
| **n8n on Railway** | §2.1 — owned by jake@bcapparel.com, not Mike | **retired per Mike**; decommission unverified — if still up it holds live OAuth creds + an exposed EC2-reboot webhook |
| **Shopvox** | no API — n8n scrapes the UI; legacy Railway scrape proxy (`shopvox-scrape-api-production.up.railway.app`) is dormant/cold but still the tfcu OMG client default | fragile |
| **eForce** | FG production system; no API; Playwright scrapers on the Mac push into fcc-purchase-orders | production |
| **Lightspeed X-Series** | FCC POS (`frecklesgraphicsmontana`) | production |
| **Hermes iMessage responder** | Mac-side; answers Mike's "where is design NNNN" texts via `/api/fcc-orders/lookup` | production |
| **Discord webhook** | sales-inbox phone alert (n8n "Sales email to phone") | active |
| **Square** | event sales sync every 15 min (Vercel cron); catalog/inventory writes documented as gated off pending Mike | read=production |
| **Abandoned but plugged in** | Telegram bot layer (tfcu, legacy/), n8n scratch workflows incl. a seconds-interval `Execute Command` job flagged "do not re-enable", `employee-time-clock` (uninspected), `bc-apparel-redesign` (content corpus), `apparel-art-director` + `art-studio` (art tools, no ops linkage) | — |

---

## 9. GM / GENERAL MANAGER AGENT

### 9.1 Identity — three non-human M365 accounts exist [CONFIRMED from Teams rosters/messages]

| Account | Role |
|---|---|
| `riley@bcapparel.com` ("Riley") | the operational agent (§5) |
| `hermes@bcapparel.com` ("Hermes") | present in ops chats; a 1:1 Mike↔Hermes chat shows it relaying **"Cronjob Response: riley-tpi-christine-zoho-sync"** output (4/6) — i.e., the cron-output relay identity of the Hermes runtime. The name also brands the whole runtime (`~/.hermes/`, `HERMES_CLIENT_SECRET`, HermesBC Intuit app) |
| `fcc@bcapparel.com` ("FCC") | member of "Light Speed 2026" chat. Likely the FCC-store service account. **Could not confirm whether human-operated or agent-operated.** |

### 9.2 The GM agent is called **DEMING** — and it is a governance layer, not an executor

Primary evidence: Riley → Mike, 2026-08-03 13:40 (Teams, read in full today): *"Ran tonight's collections work through Deming. **GM verdict: clean**… Deming's preflight (read-the-record) passed, and its ledger chain is intact. I adjudicated all ~20 actions against **the charter and the Tier-3 table**… every customer send and every dollar moved tonight… is a **Tier 3 class**, the ones Deming treats as **never delegable to an agent alone** (money-out, first customer touch). None was delegated. Each has your verbatim release in chat… **Deming's send-ledger shows 0 events** — not one of tonight's sends went through its **provenance chokepoint**. They're attributable only to a connector (riley@, or **the QBO connector that stamps everything 'Ailene'**). That's the exact un-attributable-authority hole **Deming was built for after the 7/31 six-message mess**. **Provenance coverage is 3% and the gate is fail-closed**… What Deming wants next (flagged, not done): route the AR send/write paths through **guarded_send**… and ratify a **machine-checkable release token for AR**. Until then, AR stays observe-only. Full adjudication: `~/.hermes/state/deming/adjudication_bc_collections_20260721.md`"*

Answers to the specific questions, with honesty about limits:

- **Name/purpose:** Deming. Governance/adjudication GM: charter + tiered-action table (Tier 3 = money-out / first-customer-touch = human-release-only), preflight "read-the-record" checks, an append-only send-ledger, and a `guarded_send` provenance chokepoint that is **fail-closed**.
- **M365 identity:** not directly confirmed. **[INFERENCE]** the "dedicated M365 account" Mike remembers is most plausibly `hermes@bcapparel.com`; Deming itself appears to speak *through Riley's* reports rather than posting under its own name — no `deming@` account surfaced in any chat roster or message I could reach.
- **Where code/config lives:** `~/.hermes/state/deming/` on the Mac mini (adjudication files confirmed); the charter/tier-table/guarded_send implementation is local-only. **Nothing on GitHub — zero hits for "GM"/"general manager"/"Deming" in all seven repos.**
- **Running?** Yes as of 2026-08-03 (adjudication executed that night). Nightly-ish cadence implied ("tonight's collections work"), exact schedule unknown.
- **Model/provider:** unknown; the surrounding Hermes fleet runs Anthropic models (`claude-opus-4-8`, `claude-sonnet-5`).
- **Triggers:** post-hoc adjudication of agent/human action batches; preflight gate for delegated sends (in principle — coverage is **3%**).
- **Teams/email/system access:** reads the record (chat releases, ledgers); its own send path (`guarded_send`) is built but almost nothing routes through it. Send-ledger had **0 events** on 8/3.
- **Authorized actions:** adjudicate, refuse (fail-closed), flag. It "originated nothing on its own" — by design.
- **Memory/state:** `~/.hermes/state/deming/` — ledger chain + adjudication markdowns.
- **Intended responsibilities vs today:** intended as the authority/provenance layer over all outbound+financial actions after an incident ("the 7/31 six-message mess" — six messages sent with un-attributable authority; details not recoverable from my sources). Today it adjudicates after the fact; the enforcement chokepoint is not yet wired into the AR/collections paths (flagged, not done).
- **Proactive without Mike?** Its findings arrive via Riley's proactive reports; Deming itself does not appear to message anyone directly.
- **Relation to Riley:** complementary and hierarchical, not overlapping: **Riley executes and reports; Deming judges and gates.** Riley explicitly runs its work "through Deming."
- **Escalation design:** Tier table — Tier 3 never delegable, requires Mike's verbatim release; proposed next step is a machine-checkable AR release token.
- **Can it assign/follow up work with Jamie/Ailene/Brittnie/Caritina/Chito?** No evidence of that. Task fan-out to staff happens via Riley's targeted chat messages and via Mike manually. Deming follows *authority*, not *work*, through completion.
- **Unfinished/disabled:** guarded_send routing of AR paths (flagged, not done); provenance coverage 3%; the "QBO connector stamps everything Ailene" attribution hole is open.
- **Local-only/uncommitted:** all of it.

### 9.3 Should Deming or Riley supervise the new BC Flow order graph? (documenting intent, not redesigning)

Original intent, as evidenced: **Riley = operations agent** (watch, chase, draft, execute released actions); **Deming = authority/provenance layer** (who may do what, provably). Neither was designed as the *outcome-owner* Issue #1 demands — Riley detects-and-reports (see the TFCU watchers), Deming validates-and-refuses. The Issue #1 "persistent order owner" role is a third function that currently exists nowhere. A faithful reading of the existing design: the order graph's deterministic transition validation and human-approval gates are exactly the slot Deming's charter/tier/release-token machinery was built to fill, and Riley's fleet is the sensor/actuator layer — but that mapping is a decision for Mike and Codex, not something either agent does today. Note also the "Master Director" daily brief (`master_director.py`) already uses GM-flavored language ("No chartered outbound queued today") — the charter concept spans Riley's runtime and Deming.

---

## B. ACTIVE BUT UNFINISHED WORK (highest-risk-of-collision list for Codex)

1. **Invoicing:** shadow worker mid-10-day-clock; closeout replay not yet trustworthy (14 holds/0 useful); live mode unauthorized. *Do not touch the cron, the scorecard, or the dry-run force-set.*
2. **Floor:** Packet 4 (order-status spine) fully verified but **stuck behind a launchctl permission error** — production serves the old build; delivery banner blocked on the vendor-PO business decision; R3 routing blocked on the Mazama pair.
3. **FedEx/UPS:** UPS shipper `24XW02` approval pending (error `182279`); tracking skill proven read-only; labels not started.
4. **Purchasing:** fcc-purchase-orders agent-autonomy schema live-but-empty; `sync-received` unscheduled; Supabase free-tier pause risk; TFCU RA reconciliation exists only as Riley warnings + a spreadsheet + a Teams chat.
5. **TFCU:** orchestrator complete-but-never-live behind SanMar provisioning, QBO creds, and 3 unmapped OMG fields; aged-order watchers detect but do not remediate.
6. **Order intake:** Teams app zip packaged, awaiting one admin upload; Zoho SO write gated off; art-approval loop hard dry-run at 2/26 coverage.
7. **bc-flow GitHub staleness:** production commits daily on the Mac with "never git push" — Codex's clone is guaranteed behind production.

## C. PRODUCTION AUTOMATIONS CURRENTLY RUNNING (exact names where known)

**Mac mini launchd:** `com.bcapparel.order-intake-worker` (60s) · `-app` · `-tunnel` · `-staleness` (08:00) · `-fidelity` (hourly 08:15–18:15) · `-fidelity-weekly` (Mon 08:05).
**Hermes cron:** `zoho_qbo_estimate_reconcile.py` (7:20/14:20 MT) · `bc_invoice_worker.py` shadow (7:35/14:35 MT, job `969c606102f1`) · `bc_floor_queue.py` (06:15/12:00/15:00 + 06:45) · `fcc_transfer_slip_watchdog` · Riley fleet: `master_director.py`, `teams_chat.py` runners, `ar_alert_delivery.py`, `bc_tax_intake_corrector.py`, `tfcu_decoration_watcher.py`, `tfcu_changed_watchman.py`, `vendor_receiving_digest.py`, FCC reorder watchman, FCC cash reconciliation, eForce SLA watcher, Open Loops shifts, AR payment sweep · `bc_process_watchman.py`.
**Vercel cron (bc-flow project):** `/api/square/sales/sync` (*/15) · `/api/supabase/heartbeat` (Mon+Thu 08:00 UTC).
**GitHub Actions (fcc-purchase-orders):** `sync-products.yml` (*/10) · `sync-sales.yml` (hourly :07) → `po.bcapparel.com`.
**Zoho→QBO estimate creator:** Mac-side Hermes component — script name to be confirmed on-host (see §2.1). *(n8n Railway: retired per Mike; not listed as running.)*
**Mac-side pushers into Vercel:** `eforce_fcc_orders.py` (hourly), `eforce_fcc_invoices.py`, Hermes iMessage responder.

## D. KNOWN TECHNICAL DEBT / FAILURE MODES (ranked by blast radius)

1. **Single point of failure: the Mac mini.** Intake, floor, invoicing shadow, reconciler, Riley, Deming, tunnels — all on one machine, with local-only code and "never push" history. Restic→B2 is the only offsite.
2. **Un-attributable authority** — QBO connector stamps everything "Ailene"; Deming provenance coverage 3%; fixing this is Deming's raison d'être and is not done.
3. **Cross-system identity loss** — no shared order key across Zoho/QBO/OMG/floor/vendor POs (0/784 vendor PO matches; 0/24 delivery joins; 2/26 art joins; the Aug 6 orphaned estimate).
4. **Detect-without-remediate everywhere** — the entire Riley fleet reports to one 1:1 chat; nothing retries, escalates on aging, or owns outcomes (Loloa deadline expired in the Veto Queue).
5. **Silent-stop integrations** — the Aug 6 Zoho→QBO halt raised no alert; tfcu stubs degrade silently; the (historical) n8n estate ran a broken job erroring daily for months with nobody notified — the pattern, not the platform, is the debt.
6. **Shared Graph token rotation race** (bc-flow worker ↔ Riley/OpenClaw) — everything 401s together.
7. **macOS TCC/launchctl permissions** repeatedly blocking deploys and vault writes.
8. **Plaintext SanMar password in tracked tfcu-automation files** (locations in §4.1) + committed Lightspeed client ID in fcc `.env.example`; secret-rotation TODOs unconfirmed.
9. **Supabase free tier** (both estates) — 7-day pause risk; bc-flow literally runs a heartbeat cron to keep it alive.
10. **Doc drift** — tfcu spec says Maton (code says Intuit); fcc README says undone (it shipped); n8n snapshot is 4 months old; two different bc-flow production paths in docs.
11. **Duplicate-side-effect windows** — intake TOCTOU double-submit; tfcu no-DB duplicate-PO risk; n8n estimate creation with no idempotency documented.
12. **ericartwork@bcapparel.com** departed but still present in Teams chats; floor docs demand it never appear in artifacts.

## E. CONTEXT CODEX WILL NOT DISCOVER FROM THE REPOSITORIES

1. **Everything in §5 and §9** — Riley's fleet, Deming, the Veto Queue, the charter/tier system: zero GitHub footprint.
2. **The live Zoho→QBO estimate creator — the thing that failed Aug 6 — is a Mac-side Hermes component with zero GitHub footprint.** Its retired n8n predecessor (Railway, jake@bcapparel.com) may still hold live OAuth credentials and an active Zoho webhook subscription; verify it is actually decommissioned.
3. **bc-flow's GitHub copy is stale by design** ("never git push"); the production tree, `.env.local`, launchd plists, and `~/.hermes/` scripts are the real system. `INVOICING_BUILD_REPORT.md` / `*_STATE.json` files in the repo are the best available proxy.
4. **The SharePoint TFCU ledger and the RA spreadsheet** are load-bearing accounting surfaces with human-entered key fields.
5. **The Windows `bcapp` machine** may still exist with the original OpenClaw workspace and token files.
6. **Human-release-in-chat is the current authorization protocol** — Mike's verbatim chat messages ("send it", "blake is a right off") are the legal basis for money-out actions under Deming's charter. Any redesign of approvals must preserve or replace that explicitly.
7. **The count-back finding** (0/28 conversions ever adjusted quantity) is the empirical heart of the invoicing build — it's in a MikeVault doc, summarized only in migration comments.
8. **`appsData.tsx` in fcc-purchase-orders** is a hand-maintained map of the whole estate including apps that live in other Vercel projects and on the Mac.
9. **Teams chats are the real WIP tracker** — replacement orders, RA negotiation, artist queues, and daily task reporting all happen there, not in any database.
10. **The master plan.** Per Mike, Claude architected the entire B&C system across prior sessions and documented it in a master plan. It is not on GitHub and did not surface in SharePoint search — read it on the Mac mini, starting from `/Users/fccmontana/Documents/MikeVault/` (`B&C Analysis/Production Flow — Architecture + Build Plan - 2026-07-26.md` is a confirmed-referenced piece of it, alongside the Agent Logs). Design intent lives there; this document is the as-built record.
11. **`employee-time-clock` was not inspected** in this audit (access declined this session) — Codex should not assume it's empty; a TIMECARD Teams chat suggests it's in use.

---

*End of handoff. Nothing in any application, schedule, or configuration was modified in producing this document.*
