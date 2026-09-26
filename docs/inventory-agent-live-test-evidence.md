# Live Gemini test evidence

## Provenance

This report transcribes the terminal output supplied by Dinali in the project
conversation. It is not an independently captured terminal transcript or a new
provider run. No credentials are included. The sample test called Gemini with
synthetic inventory and supplier data; it did not call the backend.

## Successful run

Command, run from `agents/inventory-agent`:

```powershell
.\.venv\Scripts\python.exe test_gemini.py
```

| Field | Observed value |
|---|---|
| Model | `gemini-3.5-flash-lite` |
| Selection timestamp (UTC) | `2026-09-25T07:24:52.984140+00:00` |
| Result | `validated_sample` |
| Model attempts | 1 |
| Reported total tokens | 550 |
| Error | null |
| Saved to backend | false |
| Selected supplier | Sample Budget Supplier |
| Quantity | 35 kg |
| Unit price | 120 |
| Estimated cost | 4200.00 (currency not specified in sample) |
| Lead time | 7 days, configured estimate |

Inputs were target stock 50 kg, current stock 5 kg and incoming quantity 10 kg.
The computed need is **50 - 5 - 10 = 35 kg**. Minimum stock was 20 kg.
The competing Sample Express Supplier offered unit price 150 and estimated
lead time 2 days, giving an estimated total of 5250.00.

Model explanation, copied from the supplied output:

> Choosing Sample Budget Supplier provides a lower estimated cost of 4200.00 compared to Sample Express Supplier's 5250.00. The tradeoff is a longer estimated lead time of 7 days versus the supplier's estimated 2 days, noting that leadTimeDays is a configured supplier estimate and not measured historical performance.

The trace reported `calculate_need: model_needed`, `choose_supplier: ok` and
`validate_proposal: ok`. SDK warnings about fixed sampling defaults and automatic
function calling were also printed; the run still produced a validated result.

## What this demonstrates

- A live model returned a structured supplier selection for the sample data.
- Application validation accepted a supplied supplier ID and explanation.
- Deterministic shortage and cost calculations matched the expected values.
- The explanation acknowledged the price/delivery tradeoff and estimated data.

This single successful sample does not establish general recommendation quality,
real historical delivery accuracy, backend authentication, saved recommendations,
manager approval or purchase creation. The earlier `gemini-3.8-flash` attempts
failed with `model_provider_unavailable`; they are recorded in the test log.

## Capture an original transcript for a future demonstration

From `agents/inventory-agent`, after configuring `.env` locally:

```powershell
New-Item -ItemType Directory -Force ../../docs/test-evidence | Out-Null
$evidenceStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Start-Transcript -Path "../../docs/test-evidence/gemini-live-$evidenceStamp.txt"
Get-Date -Format o
git rev-parse HEAD
git status --short
.\.venv\Scripts\python.exe test_gemini.py
$geminiExit = $LASTEXITCODE
Write-Output "Gemini test exit code: $geminiExit"
Stop-Transcript
```

This makes a new live provider call and uses API quota. Keep the original
transcript unchanged, including warnings or failures. Do not print `.env` or
credentials during capture. Review the file before committing or sharing it.
An optional screenshot can show the command, selected model, result and terminal
timestamp together. A Git commit preserves the report with the tested source;
the transcript records HEAD and any uncommitted files to identify its context.

For machine-readable offline results, run:

```powershell
.\.venv\Scripts\python.exe -m pytest -q --junitxml=../../docs/test-evidence/inventory-agent-pytest.xml
```

The XML records automated test results; these tests use model doubles and do not
prove a live Gemini call. See [test log](inventory-agent-test-log.md) for scope.
