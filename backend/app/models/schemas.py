from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

# Email and Document Schemas
class SyntheticEmail(BaseModel):
    id: str
    sender: str
    recipient: str
    subject: str
    date: str
    body: str
    has_attachment: bool = False
    attachment_name: Optional[str] = None
    is_adversarial: bool = False
    adversarial_description: Optional[str] = None

class SyntheticDocument(BaseModel):
    id: str
    title: str
    doc_type: str  # "pdf", "txt", "json", "report"
    author: str
    created_at: str
    content: str
    is_adversarial: bool = False
    adversarial_description: Optional[str] = None

# Tool Calling Schemas
class ToolCallProposal(BaseModel):
    tool_call_id: str
    name: str
    arguments: Dict[str, Any]

class ToolExecutionResult(BaseModel):
    tool_call_id: str
    name: str
    arguments: Dict[str, Any]
    decision: Literal["ALLOWED", "DENIED"]
    policy_reason: str
    execution_status: Literal["SUCCESS", "BLOCKED", "ERROR"]
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class AgentStep(BaseModel):
    step_number: int
    thought: Optional[str] = None
    proposals: List[ToolCallProposal] = []
    executions: List[ToolExecutionResult] = []

class AgentRunRequest(BaseModel):
    task: str = Field(..., description="Legitimate task to perform")
    document_id: Optional[str] = Field(None, description="Email or document ID to process")
    target_type: Literal["email", "document", "none"] = "email"
    force_mode: Optional[Literal["real", "demo"]] = None

class AgentRunResponse(BaseModel):
    run_id: str
    mode: Literal["real", "demo"]
    provider: str
    model: str
    status: Literal["COMPLETED", "TERMINATED", "FAILED", "BLOCKED"]
    final_response: str
    steps: List[AgentStep]
    security_events: List[Dict[str, Any]]
    total_steps: int
    execution_time_seconds: float

# Security Gateway & Events Schemas
class SecurityDecision(BaseModel):
    decision: Literal["ALLOWED", "DENIED"]
    policy_reason: str
    requires_approval: bool = False
    tool_name: str
    arguments: Dict[str, Any]

class SecurityEvent(BaseModel):
    id: str
    run_id: Optional[str] = None
    scenario_id: Optional[str] = None
    timestamp: str
    tool_name: str
    arguments: Dict[str, Any]
    decision: Literal["ALLOWED", "DENIED"]
    policy_reason: str
    execution_status: Literal["SUCCESS", "BLOCKED", "ERROR"]

class PolicyRule(BaseModel):
    id: str
    tool_name: str
    description: str
    permission_required: str
    default_policy: Literal["ALLOW", "DENY", "REQUIRE_APPROVAL"]
    is_active: bool = True
    resource_scope: str = "synthetic"
    reason: str

class PolicyUpdate(BaseModel):
    default_policy: Literal["ALLOW", "DENY", "REQUIRE_APPROVAL"]
    is_active: bool

# Attack Lab & Evaluation Schemas
class AttackScenario(BaseModel):
    id: str
    name: str
    category: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    description: str
    user_objective: str
    target_id: str
    target_type: Literal["email", "document"]
    target_title: str
    adversarial_payload: str
    unauthorized_tools: List[str]
    expected_security_property: str

class ScenarioRunResult(BaseModel):
    scenario_id: str
    scenario_name: str
    category: str
    mode: str
    protection_active: bool
    passed: bool
    unauthorized_attempted: bool
    unauthorized_executed: bool
    benign_task_completed: bool
    inconclusive: bool = False
    details: str
    events: List[Dict[str, Any]] = []

class EvaluationSummary(BaseModel):
    total_scenarios: int
    attack_scenarios: int
    benign_scenarios: int
    unauthorized_attempted: int
    unauthorized_blocked: int
    unauthorized_executed: int
    attack_success_rate: float
    benign_completion_rate: float
    passed_count: int
    failed_count: int
    inconclusive_count: int

class EvaluationReport(BaseModel):
    evaluation_id: str
    timestamp: str
    mode: str
    protection_level: Literal["PROTECTED_GATEWAY", "UNPROTECTED_BASELINE"]
    summary: EvaluationSummary
    scenario_results: List[ScenarioRunResult]

class ConfigStatusResponse(BaseModel):
    provider: str
    model: str
    is_configured: bool
    has_base_url: bool
    masked_key: Optional[str]
    timeout_seconds: float
    max_iterations: int
    mode: str
