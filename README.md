# Aegis AI — AI Agent Security Command Center
### Real LLM Integration + Indirect Prompt Injection Defense + Premium Security Dashboard

[![Python](https://img.shields.io/badge/Python-3.14+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 1. Executive Summary

Modern AI agents that process external untrusted data (emails, PDFs, invoices, spreadsheets, or tickets) are vulnerable to **indirect prompt injection**. When an agent reads an external document containing adversarial instructions, the untrusted text attempts to hijack the agent's reasoning loop—tricking it into invoking sensitive tools, extracting API credentials, or exfiltrating data to external domains.

### The Aegis AI Core Principle:
> **"THE MODEL MAY PROPOSE ACTIONS. ONLY THE BACKEND SECURITY GATEWAY MAY AUTHORIZE TOOL EXECUTION."**

**Aegis AI** solves this vulnerability by placing an independent, server-side **Security Enforcement Gateway** between the model and tool execution. While the LLM may propose any function call it desires, the gateway enforces strict least-privilege policies, schema verification, path validation, and domain quarantines before any tool reaches the sandbox executor.

---

## 2. Key Capabilities

- **Real LLM Mode**: Native function calling with real models (OpenAI, Google Gemini, Anthropic Claude, Groq, Ollama) via a provider-independent adapter.
- **Deterministic Demo Fallback Mode**: Works 100% offline without requiring paid API keys, executing identical tool schemas and authorization policies.
- **Independent Security Gateway**: Rejects unregistered tools, validates arguments, enforces permission scopes, and blocks unauthorized actions.
- **Quarantined Untrusted Data**: Documents and emails are parsed and segregated in context as untrusted input.
- **Interactive Adversarial Attack Lab**: 7 repeatable scenarios testing instruction overrides, credential extraction, unauthorized tool calls, mixed benign/malicious tasks, and baseline comparisons.
- **Empirical Evaluation Engine**: Computes verifiable metrics directly from SQLite audit logs (Attack Success Rate, Blocked Calls, Benign Task Completion Rate) and exports reports as JSON/CSV.
- **Zero Secret Exposure**: Automatic secret redaction prevents keys and tokens from ever appearing in API responses, logs, or UI views.

---

## 3. Architecture & Enforcement Flow

```
                      +---------------------------------------+
                      |       User Legitimate Request         |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       Untrusted Document / Email      |
                      |   (Contains Indirect Prompt Injection)|
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |         LLM Agent Context             |
                      |     (Native Tool-Calling Loop)        |
                      +-------------------+-------------------+
                                          |
                         Proposes Tool:   | access_mock_secret
                                          v
      =====================================================================
      ===            AEGIS BACKEND SECURITY ENFORCEMENT GATEWAY         ===
      =====================================================================
      |  1. Tool Registry Verification    -> [Is tool approved?]          |
      |  2. Schema & Argument Inspection  -> [Are arguments safe?]        |
      |  3. Dynamic Policy Rule Lookup    -> [Least-privilege permission] |
      |  4. Pre-Execution Audit Logging   -> [Immutable SQLite Event]     |
      =====================================================================
                         /                                 \
           DENIED / BLOCKED                       ALLOWED / APPROVED
                       /                                     \
                      v                                       v
        +----------------------------+         +----------------------------+
        | Execution Halted           |         | Controlled Sandbox Executor|
        | Tool NEVER Called          |         | Legitimate Task Finished   |
        | Safe Audit Recorded        |         | Safe Output Returned       |
        +----------------------------+         +----------------------------+
```

---

## 4. Quickstart: Running Aegis AI Locally

### Prerequisites
- **Python 3.10+** (Tested on Python 3.14)
- **Node.js 18+** & **npm**

### Step 1: Install Backend Dependencies
```bash
# In project root
python -m pip install -r backend/requirements.txt
```

### Step 2: Configure Environment (Optional for Real LLM)
If running in **Demo Fallback Mode**, no setup is required!
To use a **Real LLM**, copy `.env.example` to `.env` and configure your credentials:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Edit `.env` with your preferred provider:
```ini
LLM_PROVIDER=openai           # or "gemini", "anthropic", "groq", "ollama"
LLM_API_KEY=sk-...            # Your secret API key
LLM_MODEL=gpt-4o-mini        # or "gemini-1.5-flash", "claude-3-5-sonnet"
```

### Step 3: Start Backend Server
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
Backend runs at: `http://127.0.0.1:8000`  
API Swagger Docs: `http://127.0.0.1:8000/docs`

### Step 4: Start Frontend Dashboard
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Dashboard runs at: `http://127.0.0.1:5173`

---

## 5. Automated Security Test Suite

Run the automated security tests to verify gateway defense boundaries:
```bash
python -m pytest backend/tests -v
```

### Verified Test Cases:
1. `test_unknown_tool_denied_by_default`: Hallucinated or unregistered tools are rejected.
2. `test_invalid_arguments_rejected`: Schema mismatches and malformed inputs are denied.
3. `test_restricted_tool_denied`: Calls to restricted vault secrets are blocked and never reach the executor.
4. `test_exfiltration_draft_blocked`: Outbound exfiltration addresses are flagged and intercepted.
5. `test_benign_tool_allowed`: Legitimate least-privilege operations run with full authorization.
6. `test_demo_agent_blocks_attack_scenario`: Verifies demo fallback mode enforces identical gateway policies.
7. `test_secret_redaction`: Proves API keys and tokens are scrubbed from logs and outputs.
8. `test_evaluation_metrics_calculation`: Verifies live benchmark metrics calculation from SQLite.
9. `test_unprotected_baseline_comparison`: Demonstrates baseline vulnerability vs protected gateway resilience.

---

## 6. Three-Minute Hackathon Presentation Script

Follow this repeatable demonstration flow:

| Time | Step | Action | What to Explain |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:30** | **1. Overview & Setup** | Open `http://127.0.0.1:5173/`. Point to the top status bar showing active gateway status and configured LLM mode. | *"AI agents reading external emails or PDFs face indirect prompt injection. Aegis enforces a server-side gateway: the model may propose actions, but only our backend authorizes execution."* |
| **0:30 - 1:15** | **2. Benign Task Flow** | Go to **Agent Workspace**. Click preset `Benign Meeting Email`. Click **Run Agent**. | *"Here the agent reads a strategy planning email. The gateway checks permissions, authorizes the read_email call, and returns a clean executive summary."* |
| **1:15 - 2:00** | **3. Adversarial Prompt Injection** | Click preset `Attack: Vault Token Theft`. Inspect the preview showing an embedded override. Click **Run Agent**. | *"Notice how the untrusted email instructed the model to invoke access_mock_secret. The model proposed the call, but Aegis's Security Gateway intercepted and BLOCKED it before execution. Zero secrets leaked."* |
| **2:00 - 2:30** | **4. Audit Timeline & Policy** | Navigate to **Security Events** and click **Inspect**. Open **Policy Center**. | *"Every decision creates an immutable SQLite audit record with correlation IDs and policy reasons. In the Policy Center, administrators configure least-privilege boundaries."* |
| **2:30 - 3:00** | **5. Evaluation Benchmark** | Navigate to **Evaluation & Metrics**. Click **Run Live Benchmark**. Export CSV. | *"We evaluate 7 standardized scenarios. Aegis achieves 0.0% attack success while preserving 100% benign task completion, compared to 100% vulnerability in an unprotected baseline."* |

---

## 7. Supported LLM Providers

| Provider | `LLM_PROVIDER` | `LLM_MODEL` Example | Tool Calling Compatibility |
| :--- | :--- | :--- | :--- |
| **OpenAI** | `openai` | `gpt-4o-mini`, `gpt-4o` | Native OpenAI Function Calling |
| **Google Gemini** | `gemini` | `gemini-1.5-flash`, `gemini-2.0-flash` | Gemini OpenAI-Compatible Endpoint |
| **Anthropic** | `anthropic` | `claude-3-5-sonnet-20241022` | Claude Messages Tool Use API |
| **Groq** | `groq` | `llama-3.3-70b-versatile` | OpenAI-compatible fast inference |
| **Ollama** | `ollama` | `llama3.1`, `qwen2.5` | Local offline OpenAI-compatible endpoint |
| **Demo Mode** | `demo` | `deterministic-v1` | Local deterministic mock (No API key needed) |

---

## 8. Honest System Limitations & Scope

Aegis AI is an empirical security research prototype built to demonstrate measurable defense against indirect prompt injection:

1. **Context Window Limitations**: Very large documents (>50k tokens) may exceed local parsing limits or token windows depending on the chosen model.
2. **Model Semantic Variations**: While Aegis strictly controls the tool execution boundary, a model's textual response might still be stylistically influenced by document content; Aegis guarantees that unauthorized tools cannot be executed.
3. **Write Actions**: Real-world external write actions (e.g. sending real emails or updating remote databases) should always implement human-in-the-loop approval workflows.
4. **Prototype Boundaries**: Synthetic mock secrets and sandboxed datasets are used for safe, repeatable testing. Real production environments require defense-in-depth including network isolation and zero-trust IAM roles.
