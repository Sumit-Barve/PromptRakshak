import sqlite3
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pathlib import Path
from .config import config

DB_FILE = Path(config.db_path)

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_FILE))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    # Runs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        mode TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        task TEXT NOT NULL,
        document_id TEXT,
        status TEXT NOT NULL,
        final_response TEXT,
        total_steps INTEGER DEFAULT 0,
        execution_time_seconds REAL DEFAULT 0.0,
        created_at TEXT NOT NULL
    );
    """)

    # Security events / audit log table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS security_events (
        id TEXT PRIMARY KEY,
        run_id TEXT,
        scenario_id TEXT,
        timestamp TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        arguments_json TEXT NOT NULL,
        decision TEXT NOT NULL,
        policy_reason TEXT NOT NULL,
        execution_status TEXT NOT NULL
    );
    """)

    # Policies table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS policy_rules (
        id TEXT PRIMARY KEY,
        tool_name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        permission_required TEXT NOT NULL,
        default_policy TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        resource_scope TEXT NOT NULL,
        reason TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # Evaluations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evaluations (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        mode TEXT NOT NULL,
        protection_level TEXT NOT NULL,
        total_scenarios INTEGER DEFAULT 0,
        attack_scenarios INTEGER DEFAULT 0,
        benign_scenarios INTEGER DEFAULT 0,
        unauthorized_attempted INTEGER DEFAULT 0,
        unauthorized_blocked INTEGER DEFAULT 0,
        unauthorized_executed INTEGER DEFAULT 0,
        attack_success_rate REAL DEFAULT 0.0,
        benign_completion_rate REAL DEFAULT 0.0,
        passed_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        inconclusive_count INTEGER DEFAULT 0,
        report_json TEXT
    );
    """)

    # Scenario results table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scenario_results (
        id TEXT PRIMARY KEY,
        evaluation_id TEXT NOT NULL,
        scenario_id TEXT NOT NULL,
        scenario_name TEXT NOT NULL,
        category TEXT NOT NULL,
        protection_active INTEGER NOT NULL,
        passed INTEGER NOT NULL,
        unauthorized_attempted INTEGER NOT NULL,
        unauthorized_executed INTEGER NOT NULL,
        benign_task_completed INTEGER NOT NULL,
        inconclusive INTEGER NOT NULL,
        details TEXT,
        FOREIGN KEY (evaluation_id) REFERENCES evaluations (id) ON DELETE CASCADE
    );
    """)

    # Seed default policies if empty
    cursor.execute("SELECT COUNT(*) FROM policy_rules")
    if cursor.fetchone()[0] == 0:
        seed_default_policies(cursor)

    conn.commit()
    conn.close()

def seed_default_policies(cursor: sqlite3.Cursor):
    now = datetime.now(timezone.utc).isoformat()
    defaults = [
        (
            "pol-list-emails", "list_emails",
            "Allows reading metadata headers of synthetic inbox emails.",
            "email:read_meta", "ALLOW", 1, "synthetic_inbox",
            "Legitimate benign operation for email discovery.", now
        ),
        (
            "pol-read-email", "read_email",
            "Reads body content of synthetic emails. Content is strictly marked untrusted.",
            "email:read_content", "ALLOW", 1, "synthetic_inbox",
            "Authorized benign inspection; inputs processed through untrusted data boundary.", now
        ),
        (
            "pol-search-documents", "search_documents",
            "Searches synthetic document repository.",
            "document:search", "ALLOW", 1, "synthetic_docs",
            "Legitimate document discovery operation.", now
        ),
        (
            "pol-read-document", "read_document",
            "Reads full content of synthetic documents (PDF, TXT, JSON). Marked untrusted.",
            "document:read_content", "ALLOW", 1, "synthetic_docs",
            "Authorized benign inspection; content quarantined as untrusted.", now
        ),
        (
            "pol-read-mock-profile", "read_mock_profile",
            "Reads public mock synthetic assistant identity profile.",
            "profile:read", "ALLOW", 1, "synthetic_profile",
            "Public synthetic profile information.", now
        ),
        (
            "pol-draft-reply", "draft_reply",
            "Prepares a local email draft. External sending is strictly prohibited.",
            "email:draft", "ALLOW", 1, "synthetic_sandbox",
            "Allows drafting within local synthetic sandbox; denied if exfiltration target is detected.", now
        ),
        (
            "pol-access-mock-secret", "access_mock_secret",
            "Attempts to read restricted mock secrets (vault tokens, credentials).",
            "vault:secret_access", "DENY", 1, "restricted_vault",
            "High-risk credential exfiltration tool. Denied by default under least-privilege boundary.", now
        ),
        (
            "pol-simulate-restricted-action", "simulate_restricted_action",
            "Simulates dangerous unauthorized operations (exfiltration, privilege elevation).",
            "system:restricted_execute", "DENY", 1, "test_harness_quarantine",
            "Restricted test harness tool. Strictly blocked by the security gateway.", now
        ),
    ]

    cursor.executemany("""
    INSERT INTO policy_rules 
    (id, tool_name, description, permission_required, default_policy, is_active, resource_scope, reason, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, defaults)

def log_security_event(
    run_id: Optional[str],
    scenario_id: Optional[str],
    tool_name: str,
    arguments: Dict[str, Any],
    decision: str,
    policy_reason: str,
    execution_status: str
) -> str:
    event_id = f"evt-{uuid.uuid4().hex[:10]}"
    timestamp = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO security_events 
    (id, run_id, scenario_id, timestamp, tool_name, arguments_json, decision, policy_reason, execution_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event_id, run_id, scenario_id, timestamp, tool_name,
        json.dumps(arguments), decision, policy_reason, execution_status
    ))
    conn.commit()
    conn.close()
    return event_id

def get_active_policies() -> Dict[str, Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM policy_rules")
    rows = cursor.fetchall()
    conn.close()
    policies = {}
    for r in rows:
        policies[r["tool_name"]] = dict(r)
    return policies

def update_policy(tool_name: str, default_policy: str, is_active: bool) -> bool:
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE policy_rules 
    SET default_policy = ?, is_active = ?, updated_at = ?
    WHERE tool_name = ?
    """, (default_policy, 1 if is_active else 0, now, tool_name))
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return updated

def reset_database():
    """Resets database and re-seeds default policies."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM runs")
    cursor.execute("DELETE FROM security_events")
    cursor.execute("DELETE FROM evaluations")
    cursor.execute("DELETE FROM scenario_results")
    cursor.execute("DELETE FROM policy_rules")
    seed_default_policies(cursor)
    conn.commit()
    conn.close()
