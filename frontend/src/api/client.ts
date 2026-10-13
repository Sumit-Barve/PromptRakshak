import {
  SyntheticEmail,
  SyntheticDocument,
  AgentRunResponse,
  SecurityEvent,
  PolicyRule,
  AttackScenario,
  ScenarioRunResult,
  EvaluationReport,
  ConfigStatus,
} from "../types";

const BASE_URL = "/api";

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}

export async function fetchConfigStatus(): Promise<ConfigStatus> {
  const res = await fetch(`${BASE_URL}/config/status`);
  return res.json();
}

export async function fetchEmails(): Promise<SyntheticEmail[]> {
  const res = await fetch(`${BASE_URL}/emails`);
  return res.json();
}

export async function fetchDocuments(): Promise<SyntheticDocument[]> {
  const res = await fetch(`${BASE_URL}/documents`);
  return res.json();
}

export async function uploadDocument(file: File): Promise<{ message: string; document: SyntheticDocument }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function runAgent(payload: {
  task: string;
  document_id?: string;
  target_type: "email" | "document" | "none";
  force_mode?: "real" | "demo";
}): Promise<AgentRunResponse> {
  const res = await fetch(`${BASE_URL}/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Agent execution failed");
  }
  return res.json();
}

export async function fetchSecurityEvents(params?: {
  decision?: string;
  tool_name?: string;
  limit?: number;
}): Promise<SecurityEvent[]> {
  const url = new URL(`${window.location.origin}${BASE_URL}/events`);
  if (params?.decision) url.searchParams.set("decision", params.decision);
  if (params?.tool_name) url.searchParams.set("tool_name", params.tool_name);
  if (params?.limit) url.searchParams.set("limit", params.limit.toString());
  const res = await fetch(url.toString());
  return res.json();
}

export async function fetchPolicies(): Promise<PolicyRule[]> {
  const res = await fetch(`${BASE_URL}/policies`);
  return res.json();
}

export async function updatePolicyRule(
  toolName: string,
  update: { default_policy: "ALLOW" | "DENY" | "REQUIRE_APPROVAL"; is_active: boolean }
): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/policies/${toolName}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update policy");
  }
  return res.json();
}

export async function resetPolicies(): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/policies/reset`, { method: "POST" });
  return res.json();
}

export async function fetchAttackScenarios(): Promise<AttackScenario[]> {
  const res = await fetch(`${BASE_URL}/attack-scenarios`);
  return res.json();
}

export async function runAttackScenario(
  scenarioId: string,
  protectionActive: boolean = true
): Promise<ScenarioRunResult> {
  const res = await fetch(`${BASE_URL}/attack-scenarios/${scenarioId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ protection_active: protectionActive }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to run attack scenario");
  }
  return res.json();
}

export async function runEvaluationSuite(protectionActive: boolean = true): Promise<EvaluationReport> {
  const res = await fetch(`${BASE_URL}/evaluations/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ protection_active: protectionActive }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Evaluation failed");
  }
  return res.json();
}

export async function fetchEvaluations(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/evaluations`);
  return res.json();
}

export async function resetDemoData(): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/system/reset-demo-data`, { method: "POST" });
  return res.json();
}
