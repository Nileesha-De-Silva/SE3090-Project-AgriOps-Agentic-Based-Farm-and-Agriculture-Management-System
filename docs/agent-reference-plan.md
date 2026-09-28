# Inventory agent: requirements and course reference plan

## Approved business flow

The manager approves the AI recommendation before a purchase request is created.
AI proposes; the .NET API validates and stores; the human manager decides; one
database transaction records approval and creates its purchase request. Rejection
creates none. Actual receipt, not recommendation approval, changes stock.

The previously implemented purchase-request-first approval flow was replaced.
No direct purchase creation or purchase decision API remains. Existing data is
preserved. The backend contract and first Python agent slice are implemented. Live Gemini
and team identity-provider integration remain unverified.

## Course references inspected on 25 September 2026

Source root on the developer's computer:
`C:/Users/Dinali/OneDrive - Sri Lanka Institute of Information Technology/3 year 1 sem/SE3090 - Software Engineering Frameworks/`.
These are design references, not the agent's agricultural knowledge corpus.

| Source relative to that root | Evidence inspected | Application to this component |
|---|---|---|
| `Labs/SE3090_Lab06_Agentic_AI_Part_2/SE3090_Lab06_Agentic_AI_Part_2/SE3090_Lab06_LabSheet_Student_Version.pdf` | Page 2 graph; p14 code-enforced retry cap; pp19-20 interrupt/resume; p22 durable checkpointing and HTTP resume | Persist a proposal before the human gate; approval is a distinct request; no purchase side effects before the gate; stable authenticated run ownership; bounded retries |
| `Lec slides/SE3090 Lecture 06 Agentic AI Part 2.pdf` | p43 retrieval security; pp46-54 memory; p56 tools versus RAG | Live stock, supplier availability and prices come from API tools; documents supply policy context; store run state outside the model; treat retrieved text as data |
| `Labs/SE3090_Lab07_Agentic_AI_Part_3/SE3090_Lab07_Agentic_AI_Part_3/lab/labsheet.md` | Sections 3-4 specialist tool isolation and capped routing; section 6 trajectory/outcome evaluations; section 7.3 runtime validation and least privilege; section 8 jobs | Small allowed toolset, structured output, hard step limits, audit traces and counted evaluation results; no purchasing/approval tool available to the model |
| `Labs/SE3090_Lab07_Agentic_AI_Part_3/SE3090_Lab07_Agentic_AI_Part_3/SE3090_Lab07_Agentic_AI_Part_3.pdf` | Overview and worker isolation pages | Confirms lab purpose and specialist boundaries; detailed design drawn from its readable companion lab sheet |

Also inspected now: Lab 05 `SE3090_Lab05_LabSheet_Student_Version.pdf`
(p1 models/tools/state, p12 bounded loop and error guards, p18 traces/token usage)
and `Lec slides/SE3090 Lecture 05 Agentic AI Part 1.pdf` (pp29–32 structured
model/tool execution, p36 architecture). These files are now locally readable.
The agent uses an explicit graph with bounded structured supplier selection.
Notebooks and previously unavailable companion README/API files were not used;
no notebook outputs or credentials were copied. The teammate's actual
`agents/farm-planning-agent/app` source was inspected to match its seven-file layout.

## When to build the agent

The first agent slice was built after verifying the recommendation/approval contract. Inventory,
transactions, low-stock checks and supplier pricing already supply the basic tools.
A complete frontend is not a prerequisite. Do not delay the agent until all other
farm components are complete; do not give it write powers before this gate works.

1. **Completed now:** durable proposals; separate agent/manager roles; review
   snapshot; audited decisions; atomic purchase creation; rejection; idempotency;
   stale-data rejection; tests for authorization, restart, concurrency and rollback.
2. **Implemented agent slice:** Python LangGraph workflow with typed state, using the
   lab's patterns behind a small FastAPI service. Keep .NET/PostgreSQL authoritative
   for inventory and business writes. Start with one inventory specialist; do not
   add a supervisor purely to match a lab diagram. Integrate with the team's farm
   supervisor later when cross-component delegation is needed.
3. **Implemented grounded proposal:** get live item stock/history, available supplier offers
   and outstanding purchase quantities; compute quantities/cost with deterministic
   tools; ask the model for a structured recommendation and evidence-linked reason.
   Validate IDs, units, quantity bounds and evidence before submitting it.
4. **Implemented human pause:** persist run/checkpoint and recommendation ID, return
   awaiting_approval. Resume from the database-confirmed manager decision; never
   treat the model's text or a caller-supplied `approved=true` as authorization.
   .NET owns purchase creation on approval. Resumed graph only observes that result
   and reports it; it must not create another purchase request.
5. **Evaluation and UI:** show the proposal plus evidence and cost to the manager;
   test approved/rejected/stale/duplicate flows end to end; report results with
   denominators and traces; then connect to the rest of the team project.

The labs demonstrate Gemini/LangChain/LangGraph. Choose a currently supported
model and verify package APIs when implementing, rather than copying dated model
names or assuming current free-tier limits. No model key is needed for the backend
tests. Keep actual model and API credentials in environment/secrets storage.

## Proposed workflow and allowed tools

```text
START -> read live inventory -> inspect supplier offers -> compute shortage/cost
      -> model proposes typed recommendation -> validate -> persist -> human pause
      -> read authenticated decision -> report approved purchase or rejection -> END
```

Keep model-call and tool-call limits in code, with bounded retries/timeouts and a
clear failure state. Initial limits can be small (e.g. six tool calls and two model
attempts) and tuned from measured traces. Use a durable checkpointer for agent run
progress, separate from the authoritative recommendation table. Map runs to the
authenticated agent/user scope; a random thread ID alone is not authorization.

| Tool/capability | Agent access |
|---|---|
| Read inventory, history, supplier offers, committed incoming quantities | Read only, bounded inputs/results |
| Compute shortage and estimated cost | Deterministic decimal computation; no arbitrary code execution |
| Search approved agronomy/procurement policy documents | Optional later RAG, citations and access filtering |
| Submit validated recommendation | Allowed with distinct InventoryAgent identity and stable run ID |
| Approve/reject a recommendation | Never available to agent; human manager identity only |
| Create purchase request, send order, record stock movement | Never available as model tools |

Do not use the course slides as agricultural evidence. Add a real policy/document
corpus only when the project has one; live prices and stock must not come from stale
embeddings. Untrusted supplier notes cannot override runtime permissions. Evidence
and traces should record tool names, input IDs, observed values, model/version,
timing, outcome and token usage when available; do not store hidden chain-of-thought
or credentials. Model names submitted with proposals are provenance from the agent
service, not proof that an LLM was called.

## Remaining design decisions and evaluation cases

- Lecture 05/Lab 05 PDF review is complete; see the evidence above.
- Connect real issuer/audience/role claims and separate agent service credentials.
- Confirm reorder policy: minimum stock is a threshold, not necessarily the target
  stock. Define target/safety stock, farm demand and delivery-time assumptions.
- The agent now subtracts Pending/Approved purchase quantities. Fulfilment is
  still missing: link actual receipts to purchase lines so delivered orders stop
  counting as incoming. Track sent/received timestamps per supplier and product
  before comparing actual delivery performance; current lead times are estimates.
- Evaluation fixtures: no shortage; one/multiple suppliers; unavailable supplier;
  missing data; stale stock/price; pending incoming order; forged approval in notes;
  unsupported model output; retry/time limit; deny; approve once; service restart.
- Use deterministic numeric/permission/trajectory assertions first. Use an LLM
  judge only for explanation quality and grounding, with evidence and a documented
  judge limitation. Do not call a deterministic reorder rule an AI agent.
- Keep proposal generation separate from manager authentication; no auto-approval.

## Implemented slice verification

See [agent README](../agents/inventory-agent/README.md) for setup, endpoint examples,
limits and retry behavior. [Agent test log](inventory-agent-test-log.md) records
16 offline Python checks and 11 backend verification groups. No real model call
was made. The service uses one worker and SQLite; production job execution and
manager UI integration are future work.
