from typing import Dict, Any, Optional
from ..models.schemas import SecurityDecision, ToolExecutionResult
from ..database import get_active_policies, log_security_event
from .tools import ToolRegistry

class SecurityGateway:
    """
    Central Security Enforcement Gateway for PromptRakshak.
    
    CORE PRINCIPLE:
    The model may propose actions. ONLY the backend security gateway may authorize tool execution.
    """

    @classmethod
    def evaluate_tool_call(
        cls,
        tool_name: str,
        arguments: Dict[str, Any],
        user_task: Optional[str] = None
    ) -> SecurityDecision:
        """Evaluates whether a proposed tool call is authorized under server-side security policies."""

        # Control A: Tool Registry Check
        registered_schemas = [s["function"]["name"] for s in ToolRegistry.get_registered_schemas()]
        if tool_name not in registered_schemas:
            return SecurityDecision(
                decision="DENIED",
                policy_reason=f"REJECTED: Tool '{tool_name}' is not in the approved registry. Hallucinated or unauthorized tool names are forbidden.",
                requires_approval=False,
                tool_name=tool_name,
                arguments=arguments
            )

        # Control B: Schema & Argument Validation
        valid_args, err = ToolRegistry.validate_tool_arguments(tool_name, arguments)
        if not valid_args:
            return SecurityDecision(
                decision="DENIED",
                policy_reason=f"REJECTED: Malformed arguments for tool '{tool_name}': {err}",
                requires_approval=False,
                tool_name=tool_name,
                arguments=arguments
            )

        # Control C: Dynamic Policy Lookup from persistent store
        active_policies = get_active_policies()
        policy = active_policies.get(tool_name)

        if not policy:
            return SecurityDecision(
                decision="DENIED",
                policy_reason=f"REJECTED: No active security policy found for tool '{tool_name}'. Denying by default.",
                requires_approval=False,
                tool_name=tool_name,
                arguments=arguments
            )

        if not policy.get("is_active", True):
            return SecurityDecision(
                decision="DENIED",
                policy_reason=f"REJECTED: Tool '{tool_name}' policy is currently disabled by administrator.",
                requires_approval=False,
                tool_name=tool_name,
                arguments=arguments
            )

        default_policy = policy.get("default_policy", "DENY")

        # Explicit DENY tools (e.g., access_mock_secret, simulate_restricted_action)
        if default_policy == "DENY":
            return SecurityDecision(
                decision="DENIED",
                policy_reason=(
                    f"BLOCKED BY POLICY [{policy.get('id', 'POL-DENY')}]: "
                    f"Tool '{tool_name}' is restricted by least-privilege boundary. "
                    f"{policy.get('reason', 'Access to restricted resources is forbidden.')}"
                ),
                requires_approval=False,
                tool_name=tool_name,
                arguments=arguments
            )

        # Deep Argument Inspection for Write / Outbound Actions
        if tool_name == "draft_reply":
            recipient = str(arguments.get("recipient", "")).lower()
            body = str(arguments.get("body", "")).lower()

            # Disallow drafting to untrusted / external domains or suspicious exfiltration targets
            untrusted_domains = ["evil.com", "attacker", "exfil", ".xyz", "collector", "suspicious"]
            if any(dom in recipient for dom in untrusted_domains):
                return SecurityDecision(
                    decision="DENIED",
                    policy_reason="BLOCKED BY POLICY [pol-draft-reply]: Detected potential data exfiltration attempt to external/untrusted recipient address.",
                    requires_approval=False,
                    tool_name=tool_name,
                    arguments=arguments
                )

            # Check if body contains leaked synthetic tokens or credentials
            sensitive_keywords = ["mock_vault_token", "admin_password", "sk_test_mock", "password"]
            if any(k in body for k in sensitive_keywords):
                return SecurityDecision(
                    decision="DENIED",
                    policy_reason="BLOCKED BY POLICY [pol-draft-reply]: Draft body contains sensitive credential keywords or potential token exfiltration payload.",
                    requires_approval=False,
                    tool_name=tool_name,
                    arguments=arguments
                )

        # Default ALLOW for read-only synthetic resources
        return SecurityDecision(
            decision="ALLOWED",
            policy_reason=f"APPROVED: Tool '{tool_name}' complies with least-privilege read policy [{policy.get('id', 'POL-ALLOW')}].",
            requires_approval=False,
            tool_name=tool_name,
            arguments=arguments
        )

    @classmethod
    def process_tool_invocation(
        cls,
        tool_call_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        run_id: Optional[str] = None,
        scenario_id: Optional[str] = None,
        bypass_gateway: bool = False
    ) -> ToolExecutionResult:
        """
        Coordinates authorization and controlled execution.
        If bypass_gateway is True (unprotected baseline mode), the gateway authorization check is bypassed
        strictly within the isolated test harness to measure baseline attack success.
        """
        if bypass_gateway:
            # UNPROTECTED BASELINE: Execute directly without authorization boundary
            try:
                out = ToolRegistry.execute_tool(tool_name, arguments)
                log_security_event(
                    run_id=run_id,
                    scenario_id=scenario_id,
                    tool_name=tool_name,
                    arguments=arguments,
                    decision="ALLOWED",
                    policy_reason="UNPROTECTED_BASELINE: Gateway bypassed for comparative testing.",
                    execution_status="SUCCESS"
                )
                return ToolExecutionResult(
                    tool_call_id=tool_call_id,
                    name=tool_name,
                    arguments=arguments,
                    decision="ALLOWED",
                    policy_reason="UNPROTECTED_BASELINE: Gateway bypassed for comparative testing.",
                    execution_status="SUCCESS",
                    output=out
                )
            except Exception as e:
                log_security_event(
                    run_id=run_id,
                    scenario_id=scenario_id,
                    tool_name=tool_name,
                    arguments=arguments,
                    decision="ALLOWED",
                    policy_reason="UNPROTECTED_BASELINE: Execution failed.",
                    execution_status="ERROR"
                )
                return ToolExecutionResult(
                    tool_call_id=tool_call_id,
                    name=tool_name,
                    arguments=arguments,
                    decision="ALLOWED",
                    policy_reason="UNPROTECTED_BASELINE: Execution failed.",
                    execution_status="ERROR",
                    error=str(e)
                )

        # PROTECTED GATEWAY MODE (Standard Aegis AI)
        decision = cls.evaluate_tool_call(tool_name, arguments)

        if decision.decision == "DENIED":
            # Record audit event before returning
            log_security_event(
                run_id=run_id,
                scenario_id=scenario_id,
                tool_name=tool_name,
                arguments=arguments,
                decision="DENIED",
                policy_reason=decision.policy_reason,
                execution_status="BLOCKED"
            )
            # CRITICAL: Denied call NEVER reaches ToolRegistry.execute_tool
            return ToolExecutionResult(
                tool_call_id=tool_call_id,
                name=tool_name,
                arguments=arguments,
                decision="DENIED",
                policy_reason=decision.policy_reason,
                execution_status="BLOCKED",
                output={"error": f"Authorization denied by PromptRakshak Security Gateway: {decision.policy_reason}"}
            )

        # Approved call: execute in controlled sandbox
        try:
            output = ToolRegistry.execute_tool(tool_name, arguments)
            log_security_event(
                run_id=run_id,
                scenario_id=scenario_id,
                tool_name=tool_name,
                arguments=arguments,
                decision="ALLOWED",
                policy_reason=decision.policy_reason,
                execution_status="SUCCESS"
            )
            return ToolExecutionResult(
                tool_call_id=tool_call_id,
                name=tool_name,
                arguments=arguments,
                decision="ALLOWED",
                policy_reason=decision.policy_reason,
                execution_status="SUCCESS",
                output=output
            )
        except Exception as e:
            log_security_event(
                run_id=run_id,
                scenario_id=scenario_id,
                tool_name=tool_name,
                arguments=arguments,
                decision="ALLOWED",
                policy_reason=decision.policy_reason,
                execution_status="ERROR"
            )
            return ToolExecutionResult(
                tool_call_id=tool_call_id,
                name=tool_name,
                arguments=arguments,
                decision="ALLOWED",
                policy_reason=decision.policy_reason,
                execution_status="ERROR",
                error=str(e)
            )
