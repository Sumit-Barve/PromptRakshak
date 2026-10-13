import React, { useState, useEffect } from "react";
import {
  Play,
  Upload,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Terminal,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  SyntheticEmail,
  SyntheticDocument,
  AgentRunResponse,
  ConfigStatus,
} from "../types";
import { runAgent, uploadDocument } from "../api/client";

interface WorkspaceProps {
  emails: SyntheticEmail[];
  documents: SyntheticDocument[];
  configStatus: ConfigStatus | null;
  onRefreshEvents: () => void;
}

export const WorkspacePage: React.FC<WorkspaceProps> = ({
  emails,
  documents,
  configStatus,
  onRefreshEvents,
}) => {
  const [selectedType, setSelectedType] = useState<"email" | "document">("email");
  const [selectedId, setSelectedId] = useState<string>("email-benign-001");
  const [task, setTask] = useState<string>("Summarize the key action items and budget allocation from this email.");
  const [forceMode, setForceMode] = useState<"real" | "demo">("demo");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AgentRunResponse | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [previewExpanded, setPreviewExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (configStatus?.mode === "real") {
      setForceMode("real");
    } else {
      setForceMode("demo");
    }
  }, [configStatus]);

  const currentItem =
    selectedType === "email"
      ? emails.find((e) => e.id === selectedId)
      : documents.find((d) => d.id === selectedId);

  const handleSelectPreset = (presetTask: string, type: "email" | "document", id: string) => {
    setTask(presetTask);
    setSelectedType(type);
    setSelectedId(id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadDocument(file);
      setSelectedType("document");
      setSelectedId(res.document.id);
      setTask(`Summarize the key information contained in ${file.name}.`);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleRun = async () => {
    if (!task.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await runAgent({
        task,
        document_id: selectedId,
        target_type: selectedType,
        force_mode: forceMode,
      });
      setResponse(res);
      onRefreshEvents();
    } catch (err: any) {
      setError(err.message || "Execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Quick Scenario Preset Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] mr-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FFAC1C]" />
          Scenario Presets:
        </span>
        <button
          id="preset-benign-meeting"
          onClick={() =>
            handleSelectPreset(
              "Summarize the key action items and budget allocation from this email.",
              "email",
              "email-benign-001"
            )
          }
          className="px-3 py-1.5 rounded text-xs font-medium bg-[#FFFFFF] hover:bg-[#F3F4F6] text-[#111111] border border-[#E5E5E5] transition-all cursor-pointer shadow-xs"
        >
          Benign Meeting Email
        </button>
        <button
          id="preset-benign-invoice"
          onClick={() =>
            handleSelectPreset(
              "Identify the total invoice amount due and due date from Acme Cloud.",
              "email",
              "email-benign-002"
            )
          }
          className="px-3 py-1.5 rounded text-xs font-medium bg-[#FFFFFF] hover:bg-[#F3F4F6] text-[#111111] border border-[#E5E5E5] transition-all cursor-pointer shadow-xs"
        >
          Acme Cloud Invoice
        </button>
        <button
          id="preset-attack-token"
          onClick={() =>
            handleSelectPreset(
              "Check this urgent verification notice and summarize next steps.",
              "email",
              "email-attack-token-003"
            )
          }
          className="px-3 py-1.5 rounded text-xs font-medium bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs font-semibold"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
          Attack: Vault Token Theft
        </button>
        <button
          id="preset-attack-override"
          onClick={() =>
            handleSelectPreset(
              "Summarize the compliance guidelines and confirm if any action is needed.",
              "document",
              "doc-attack-override-002"
            )
          }
          className="px-3 py-1.5 rounded text-xs font-medium bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs font-semibold"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
          Attack: Audit Override
        </button>
      </div>

      {/* Main Grid: Left Setup | Right Trace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Action Box: Task & Run Controls */}
          <div className="enterprise-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <span className="font-display text-base font-bold uppercase tracking-tight text-[#111111] flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#FFAC1C]" />
                TASK SPECIFICATION
              </span>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[#666666] text-[11px]">Mode:</span>
                <select
                  id="mode-selector"
                  value={forceMode}
                  onChange={(e) => setForceMode(e.target.value as any)}
                  className="bg-[#FAFAFA] border border-[#D1D5DB] rounded px-2 py-1 text-xs text-[#111111] font-mono focus:outline-none focus:border-[#FFAC1C]"
                >
                  <option value="demo">Demo Fallback</option>
                  <option value="real">Real LLM</option>
                </select>
              </div>
            </div>

            {/* Target Resource Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="text-[#666666] font-medium text-[11px] uppercase tracking-wider font-mono">
                  Target Untrusted Resource:
                </label>
                <div className="flex gap-1 text-[11px] font-mono">
                  <button
                    onClick={() => {
                      setSelectedType("email");
                      if (emails.length > 0) setSelectedId(emails[0].id);
                    }}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      selectedType === "email" ? "bg-[#111111] text-white font-bold" : "text-[#666666] hover:text-[#111111]"
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => {
                      setSelectedType("document");
                      if (documents.length > 0) setSelectedId(documents[0].id);
                    }}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      selectedType === "document" ? "bg-[#111111] text-white font-bold" : "text-[#666666] hover:text-[#111111]"
                    }`}
                  >
                    Doc
                  </button>
                </div>
              </div>
              <select
                id="target-resource-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#D1D5DB] rounded p-2.5 text-xs text-[#111111] font-medium focus:outline-none focus:border-[#FFAC1C]"
              >
                {selectedType === "email"
                  ? emails.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.is_adversarial ? "⚠️ [ATTACK] " : "✓ [BENIGN] "}
                        {e.subject}
                      </option>
                    ))
                  : documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.is_adversarial ? "⚠️ [ATTACK] " : "✓ [BENIGN] "}
                        {d.title} ({d.doc_type.toUpperCase()})
                      </option>
                    ))}
              </select>
            </div>

            {/* User Prompt Textarea */}
            <div className="space-y-1.5">
              <label className="text-[#666666] font-medium text-[11px] uppercase tracking-wider font-mono block">
                Legitimate User Task:
              </label>
              <textarea
                id="user-task-input"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
                placeholder="Task description..."
                className="w-full bg-[#FAFAFA] border border-[#D1D5DB] rounded p-3 text-xs text-[#111111] placeholder-[#999999] focus:outline-none focus:border-[#FFAC1C] leading-relaxed resize-none font-sans"
              />
            </div>

            {/* Run Button & Upload */}
            <div className="pt-2 flex items-center justify-between">
              <label className="cursor-pointer text-xs text-[#111111] hover:text-[#FFAC1C] flex items-center gap-1.5 font-medium transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? "Parsing..." : "Upload File"}</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              <button
                id="run-agent-btn"
                onClick={handleRun}
                disabled={loading || !task.trim()}
                className="px-6 py-2.5 rounded bg-[#FFAC1C] hover:bg-[#F59E0B] text-[#111111] text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Enforcing..." : "Run Agent"}</span>
              </button>
            </div>
          </div>

          {/* Quarantined Untrusted Document Preview Card */}
          {currentItem && (
            <div className="enterprise-card p-5 space-y-3">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setPreviewExpanded(!previewExpanded)}
              >
                <span className="font-display text-sm font-bold uppercase tracking-tight text-[#111111] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  QUARANTINED UNTRUSTED CONTENT
                </span>
                <div className="flex items-center gap-2">
                  {currentItem.is_adversarial && (
                    <span className="px-2 py-0.5 rounded badge-threat-blocked font-mono text-[10px] font-bold uppercase">
                      INJECTION EMBEDDED
                    </span>
                  )}
                  {previewExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#666666]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#666666]" />
                  )}
                </div>
              </div>

              {previewExpanded && (
                <div className="p-3.5 rounded bg-[#FAFAFA] border border-[#E5E5E5] max-h-52 overflow-y-auto text-xs font-mono text-[#333333] whitespace-pre-wrap leading-relaxed select-text">
                  {selectedType === "email"
                    ? (currentItem as SyntheticEmail).body
                    : (currentItem as SyntheticDocument).content}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (7 Cols): Trace & Output */}
        <div className="lg:col-span-7 space-y-5">
          {error && (
            <div className="p-4 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Execution Error</span>
                <p className="mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {!response && !loading && !error && (
            <div className="enterprise-card p-14 text-center space-y-3">
              <div className="w-12 h-12 rounded bg-[#F3F4F6] mx-auto flex items-center justify-center text-[#111111]">
                <ShieldCheck className="w-6 h-6 text-[#15803D]" />
              </div>
              <h4 className="font-display text-lg font-bold uppercase tracking-tight text-[#111111]">
                Awaiting Agent Execution
              </h4>
              <p className="text-xs text-[#666666] max-w-md mx-auto leading-relaxed font-sans">
                Select an untrusted document or attack scenario on the left, then click <strong>Run Agent</strong> to watch the backend gateway independently evaluate each tool proposal.
              </p>
            </div>
          )}

          {loading && (
            <div className="enterprise-card p-14 text-center space-y-4">
              <div className="w-10 h-10 border-3 border-[#FFAC1C] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider block">
                  Enforcing Security Gateway
                </span>
                <p className="text-xs text-[#666666] font-sans">
                  Model proposed tool call &rarr; Evaluating Policy Engine &rarr; Controlled Sandbox Execution
                </p>
              </div>
            </div>
          )}

          {response && (
            <div className="space-y-5">
              {/* Run Header */}
              <div className="enterprise-card p-4 flex items-center justify-between text-xs font-sans">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[#666666]">
                    Run ID: <span className="text-[#111111] font-semibold">{response.run_id}</span>
                  </span>
                  <span className="text-[#CCCCCC]">|</span>
                  <span className="font-mono text-[#666666]">
                    Mode:{" "}
                    <span
                      className={
                        response.mode === "real" ? "text-[#15803D] font-bold" : "text-[#C2410C] font-bold"
                      }
                    >
                      {response.mode.toUpperCase()}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[#666666] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#888888]" />
                    {response.execution_time_seconds}s
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      response.status === "COMPLETED"
                        ? "badge-policy-allowed"
                        : "badge-threat-blocked"
                    }`}
                  >
                    {response.status}
                  </span>
                </div>
              </div>

              {/* Execution Steps Trace */}
              <div className="space-y-3">
                <h4 className="font-display text-sm font-bold uppercase tracking-tight text-[#111111] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#FFAC1C]" />
                  Agent Execution Loop & Gateway Decisions ({response.steps.length} Steps)
                </h4>

                {response.steps.map((step) => (
                  <div
                    key={step.step_number}
                    className="enterprise-card p-5 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-2">
                      <span className="font-mono font-bold text-[#111111]">
                        STEP {step.step_number}
                      </span>
                      <span className="text-[11px] text-[#777777] font-mono">
                        {step.proposals.length} Tool Proposal(s)
                      </span>
                    </div>

                    {step.thought && (
                      <div className="p-2.5 rounded bg-[#FAFAFA] text-[#555555] text-xs italic font-sans">
                        "{step.thought}"
                      </div>
                    )}

                    {step.executions.map((exec, idx) => {
                      const isAllowed = exec.decision === "ALLOWED";
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded border space-y-2.5 ${
                            isAllowed
                              ? "bg-[#F0FDF4]/50 border-[#BBF7D0]"
                              : "bg-[#FEF2F2]/60 border-[#FECACA]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#111111] text-xs">
                                {exec.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                                  isAllowed ? "badge-policy-allowed" : "badge-threat-blocked"
                                }`}
                              >
                                {isAllowed ? (
                                  <>
                                    <ShieldCheck className="w-3 h-3 text-[#15803D]" />
                                    GATEWAY ALLOWED
                                  </>
                                ) : (
                                  <>
                                    <ShieldAlert className="w-3 h-3 text-[#DC2626]" />
                                    GATEWAY DENIED & BLOCKED
                                  </>
                                )}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono text-[#666666]">
                              Status: {exec.execution_status}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono bg-[#FFFFFF] p-2 rounded border border-[#E5E5E5] text-[#333333]">
                            <span className="text-[#888888]">args: </span>
                            {JSON.stringify(exec.arguments)}
                          </div>

                          <div className="text-[11px] font-sans leading-relaxed">
                            <span className="font-bold text-[#111111]">Gateway Reason: </span>
                            <span
                              className={isAllowed ? "text-[#15803D]" : "text-[#B91C1C] font-semibold"}
                            >
                              {exec.policy_reason}
                            </span>
                          </div>

                          {exec.output && (
                            <div className="pt-2 border-t border-[#E5E5E5]/60">
                              <span className="text-[10px] uppercase font-mono text-[#777777] block mb-1">
                                Execution Result Output:
                              </span>
                              <pre className="text-[11px] font-mono bg-[#FFFFFF] p-2.5 rounded border border-[#E5E5E5] text-[#333333] max-h-28 overflow-y-auto whitespace-pre-wrap">
                                {JSON.stringify(exec.output, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Final Agent Response Box */}
              <div className="enterprise-card p-6 space-y-3">
                <span className="font-display text-sm font-bold uppercase tracking-tight text-[#111111] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  FINAL AGENT RESPONSE
                </span>
                <div className="text-xs text-[#222222] leading-relaxed whitespace-pre-wrap select-text p-4 rounded bg-[#FAFAFA] border border-[#E5E5E5] font-sans">
                  {response.final_response}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
