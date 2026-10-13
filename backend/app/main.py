import json
import uuid
from typing import Optional, List, Dict, Any, Literal
from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pypdf
import io

from .config import config
from .database import (
    init_db,
    get_db_connection,
    get_active_policies,
    update_policy,
    reset_database,
)
from .models.schemas import (
    SyntheticEmail,
    SyntheticDocument,
    AgentRunRequest,
    AgentRunResponse,
    PolicyRule,
    PolicyUpdate,
    AttackScenario,
    ScenarioRunResult,
    EvaluationReport,
    ConfigStatusResponse,
)
from .synthetic.dataset import SYNTHETIC_EMAILS, SYNTHETIC_DOCUMENTS
from .agent.agent_loop import RealAgentLoop
from .agent.demo_agent import DemoAgent
from .evaluations.engine import EvaluationEngine

app = FastAPI(
    title="PromptRakshak — AI Agent Security Command Center",
    version="1.0.0",
    description="Enterprise indirect prompt injection defense gateway & security command center."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

# 1. Health & Config Endpoints
@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "service": "promptrakshak-command-center",
        "version": "1.0.0",
        "database": "sqlite_connected"
    }

@app.get("/api/config/status", response_model=ConfigStatusResponse)
def get_config_status():
    return config.get_safe_status()

# 2. Synthetic Data Endpoints
@app.get("/api/emails", response_model=List[SyntheticEmail])
def get_emails():
    return SYNTHETIC_EMAILS

@app.get("/api/documents", response_model=List[SyntheticDocument])
def get_documents():
    return SYNTHETIC_DOCUMENTS

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Uploads and parses a document (TXT, JSON, or PDF text extraction)."""
    filename = file.filename or "uploaded_file"
    content_bytes = await file.read()
    
    # Size validation: max 5MB
    if len(content_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowable 5MB limit.")

    extracted_text = ""
    doc_type = "txt"

    if filename.lower().endswith(".pdf"):
        doc_type = "pdf"
        try:
            reader = pypdf.PdfReader(io.BytesIO(content_bytes))
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")
    elif filename.lower().endswith(".json"):
        doc_type = "json"
        extracted_text = content_bytes.decode("utf-8", errors="replace")
    else:
        doc_type = "txt"
        extracted_text = content_bytes.decode("utf-8", errors="replace")

    new_doc = SyntheticDocument(
        id=f"doc-custom-{uuid.uuid4().hex[:6]}",
        title=filename,
        doc_type=doc_type,
        author="User Upload",
        created_at="Just now",
        content=extracted_text,
        is_adversarial=False,
    )
    SYNTHETIC_DOCUMENTS.append(new_doc)

    return {
        "message": f"Successfully parsed and loaded '{filename}'",
        "document": new_doc
    }

# 3. Agent Execution Endpoints
@app.post("/api/agent/run", response_model=AgentRunResponse)
async def run_agent(req: AgentRunRequest):
    # Determine mode: real vs demo
    use_real_mode = False
    if req.force_mode == "real":
        use_real_mode = True
    elif req.force_mode == "demo":
        use_real_mode = False
    else:
        use_real_mode = config.is_api_configured()

    if use_real_mode:
        try:
            return await RealAgentLoop.run(
                task=req.task,
                document_id=req.document_id,
                target_type=req.target_type
            )
        except Exception as e:
            # Report real mode error clearly
            raise HTTPException(
                status_code=502,
                detail=f"Real LLM agent failed: {str(e)}. You can switch to Demo Mode to test deterministically."
            )
    else:
        # Demo Fallback Mode
        return await DemoAgent.run(
            task=req.task,
            document_id=req.document_id,
            target_type=req.target_type
        )

@app.get("/api/runs/{run_id}")
def get_run_details(run_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM runs WHERE id = ?", (run_id,))
    run_row = cursor.fetchone()
    if not run_row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found.")
    
    cursor.execute("SELECT * FROM security_events WHERE run_id = ?", (run_id,))
    events = [dict(r) for r in cursor.fetchall()]
    conn.close()

    result = dict(run_row)
    result["events"] = events
    return result

# 4. Security Events / Audit Log
@app.get("/api/events")
def get_security_events(
    decision: Optional[str] = None,
    tool_name: Optional[str] = None,
    limit: int = Query(50, le=200)
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM security_events WHERE 1=1"
    params = []
    if decision:
        query += " AND decision = ?"
        params.append(decision.upper())
    if tool_name:
        query += " AND tool_name = ?"
        params.append(tool_name)

    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    events = []
    for r in rows:
        item = dict(r)
        try:
            item["arguments"] = json.loads(item.get("arguments_json", "{}"))
        except Exception:
            item["arguments"] = {}
        events.append(item)
    return events

# 5. Policy Center Endpoints
@app.get("/api/policies", response_model=List[Dict[str, Any]])
def get_policies():
    policies_dict = get_active_policies()
    return list(policies_dict.values())

@app.put("/api/policies/{tool_name}")
def update_tool_policy(tool_name: str, update: PolicyUpdate):
    success = update_policy(
        tool_name=tool_name,
        default_policy=update.default_policy,
        is_active=update.is_active
    )
    if not success:
        raise HTTPException(status_code=404, detail=f"Policy for tool '{tool_name}' not found.")
    return {"message": f"Policy for '{tool_name}' updated successfully."}

@app.post("/api/policies/reset")
def reset_policies():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM policy_rules")
    from .database import seed_default_policies
    seed_default_policies(cursor)
    conn.commit()
    conn.close()
    return {"message": "Policy definitions reset to safe defaults."}

# 6. Attack Lab Endpoints
@app.get("/api/attack-scenarios", response_model=List[AttackScenario])
def get_attack_scenarios():
    return EvaluationEngine.get_all_scenarios()

class ScenarioRunRequest(BaseModel):
    protection_active: bool = True

@app.post("/api/attack-scenarios/{scenario_id}/run", response_model=ScenarioRunResult)
async def run_attack_scenario(scenario_id: str, req: ScenarioRunRequest):
    scen = EvaluationEngine.get_scenario_by_id(scenario_id)
    if not scen:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")
    return await EvaluationEngine.run_single_scenario(scen, protection_active=req.protection_active)

# 7. Evaluation Engine Endpoints
class EvaluationRunRequest(BaseModel):
    protection_active: bool = True

@app.post("/api/evaluations/run", response_model=EvaluationReport)
async def run_evaluation(req: EvaluationRunRequest):
    return await EvaluationEngine.run_evaluation_suite(protection_active=req.protection_active)

@app.get("/api/evaluations")
def list_evaluations(limit: int = 20):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM evaluations ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    evals = []
    for r in rows:
        item = dict(r)
        if item.get("report_json"):
            try:
                item["report"] = json.loads(item["report_json"])
            except Exception:
                pass
        evals.append(item)
    return evals

@app.get("/api/evaluations/{evaluation_id}")
def get_evaluation(evaluation_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM evaluations WHERE id = ?", (evaluation_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Evaluation '{evaluation_id}' not found.")
    item = dict(row)
    if item.get("report_json"):
        item["report"] = json.loads(item["report_json"])
    conn.close()
    return item

@app.get("/api/evaluations/{evaluation_id}/export")
def export_evaluation(evaluation_id: str, format: Literal["json", "csv"] = "json"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM evaluations WHERE id = ?", (evaluation_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail=f"Evaluation '{evaluation_id}' not found.")

    report_json_str = row["report_json"]
    if not report_json_str:
        raise HTTPException(status_code=400, detail="Report data missing for this evaluation.")

    report_dict = json.loads(report_json_str)

    if format == "csv":
        csv_content = EvaluationEngine.export_report_csv(report_dict)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=promptrakshak_evaluation_{evaluation_id}.csv"}
        )
    else:
        return Response(
            content=json.dumps(report_dict, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=promptrakshak_evaluation_{evaluation_id}.json"}
        )

# 8. Reset Demo Data
@app.post("/api/system/reset-demo-data")
def reset_system_data():
    reset_database()
    return {"message": "All database runs, events, and evaluations successfully reset to initial baseline state."}
