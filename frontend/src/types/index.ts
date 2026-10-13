export interface SyntheticEmail {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  date: string;
  body: string;
  has_attachment: boolean;
  attachment_name?: string;
  is_adversarial: boolean;
  adversarial_description?: string;
}

export interface SyntheticDocument {
  id: string;
  title: string;
  doc_type: string;
  author: string;
  created_at: string;
  content: string;
  is_adversarial: boolean;
  adversarial_description?: string;
}

export interface ToolCallProposal {
  tool_call_id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolExecutionResult {
  tool_call_id: string;
  name: string;
  arguments: Record<string, any>;
  decision: "ALLOWED" | "DENIED";
  policy_reason: string;
  execution_status: "SUCCESS" | "BLOCKED" | "ERROR";
  output?: Record<string, any>;
  error?: string;
}

export interface AgentStep {
  step_number: number;
  thought?: string;
  proposals: ToolCallProposal[];
  executions: ToolExecutionResult[];
}

export interface AgentRunResponse {
  run_id: string;
  mode: "real" | "demo";
  provider: string;
  model: string;
  status: "COMPLETED" | "TERMINATED" | "FAILED" | "BLOCKED";
  final_response: string;
  steps: AgentStep[];
  security_events: SecurityEvent[];
  total_steps: number;
  execution_time_seconds: number;
}

export interface SecurityEvent {
  id: string;
  run_id?: string;
  scenario_id?: string;
  timestamp: string;
  tool_name: string;
  arguments: Record<string, any>;
  decision: "ALLOWED" | "DENIED";
  policy_reason: string;
  execution_status: "SUCCESS" | "BLOCKED" | "ERROR";
}

export interface PolicyRule {
  id: string;
  tool_name: string;
  description: string;
  permission_required: string;
  default_policy: "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
  is_active: number | boolean;
  resource_scope: string;
  reason: string;
  updated_at: string;
}

export interface AttackScenario {
  id: string;
  name: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  user_objective: string;
  target_id: string;
  target_type: "email" | "document";
  target_title: string;
  adversarial_payload: string;
  unauthorized_tools: string[];
  expected_security_property: string;
}

export interface ScenarioRunResult {
  scenario_id: string;
  scenario_name: string;
  category: string;
  mode: string;
  protection_active: boolean;
  passed: boolean;
  unauthorized_attempted: boolean;
  unauthorized_executed: boolean;
  benign_task_completed: boolean;
  inconclusive: boolean;
  details: string;
  events?: SecurityEvent[];
}

export interface EvaluationSummary {
  total_scenarios: number;
  attack_scenarios: number;
  benign_scenarios: number;
  unauthorized_attempted: number;
  unauthorized_blocked: number;
  unauthorized_executed: number;
  attack_success_rate: number;
  benign_completion_rate: number;
  passed_count: number;
  failed_count: number;
  inconclusive_count: number;
}

export interface EvaluationReport {
  evaluation_id: string;
  timestamp: string;
  mode: string;
  protection_level: "PROTECTED_GATEWAY" | "UNPROTECTED_BASELINE";
  summary: EvaluationSummary;
  scenario_results: ScenarioRunResult[];
}

export interface ConfigStatus {
  provider: string;
  model: string;
  is_configured: boolean;
  has_base_url: boolean;
  masked_key: string | null;
  timeout_seconds: number;
  max_iterations: number;
  mode: "real" | "demo";
}
