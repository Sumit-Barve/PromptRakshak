import React, { useState } from "react";
import {
  Key,
  Cpu,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Server,
} from "lucide-react";
import { ConfigStatus } from "../types";
import { resetDemoData, fetchHealth } from "../api/client";

interface SettingsPageProps {
  configStatus: ConfigStatus | null;
  onRefreshConfig: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  configStatus,
  onRefreshConfig,
}) => {
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleResetData = async () => {
    setResetting(true);
    try {
      await resetDemoData();
      setResetMsg("All SQLite database records, runs, events, and benchmarks have been reset.");
      onRefreshConfig();
      setTimeout(() => setResetMsg(null), 4000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  const handleCheckHealth = async () => {
    try {
      const h = await fetchHealth();
      setHealthStatus(h);
    } catch (e: any) {
      setHealthStatus({ status: "error", error: e.message });
    }
  };

  const envSample = `# To configure your LLM, copy .env.example to .env and set:
LLM_PROVIDER=openai           # or "gemini", "anthropic", "groq", "ollama"
LLM_API_KEY=your_secret_key   # Never committed, printed, or exposed!
LLM_MODEL=gpt-4o-mini        # or "gemini-1.5-flash", "claude-3-5-sonnet"
LLM_BASE_URL=                 # Optional custom base endpoint`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-8 rounded-lg bg-[#111111] text-white border border-[#262626] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFAC1C] text-[#111111]">
              GATEWAY CONFIGURATION
            </span>
            <span className="text-xs text-[#888888] font-mono">
              Provider-Independent Setup
            </span>
          </div>
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white leading-none">
            SYSTEM & <span className="text-[#FFAC1C]">LLM INTEGRATION</span>
          </h2>
          <p className="text-xs md:text-sm text-[#CCCCCC] leading-relaxed font-sans">
            PromptRakshak supports both native Real LLM function calling and a deterministic Demo Fallback Mode. Credentials are read exclusively by the backend and never exposed to the frontend or logs.
          </p>
        </div>

        <button
          onClick={handleCheckHealth}
          className="px-4 py-2.5 rounded bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-bold font-sans uppercase tracking-wider border border-[#333333] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Server className="w-3.5 h-3.5 text-[#FFAC1C]" />
          <span>Test API Health</span>
        </button>
      </div>

      {healthStatus && (
        <div className="enterprise-card p-4 border-l-4 border-l-[#15803D] text-xs font-mono flex items-center justify-between font-sans">
          <span className="text-[#333333]">
            Backend API Health: <strong className="text-[#15803D] uppercase font-mono">{healthStatus.status}</strong>
          </span>
          <span className="text-[#666666] font-mono">Database: {healthStatus.database}</span>
        </div>
      )}

      {/* Grid: Left Current Status | Right Safe Configuration Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Config Summary */}
        <div className="enterprise-card p-6 space-y-5 text-xs font-sans">
          <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
            <Cpu className="w-4 h-4 text-[#FFAC1C]" />
            <h3 className="font-display text-base font-bold uppercase tracking-tight text-[#111111]">
              CURRENT RUNTIME CONFIGURATION
            </h3>
          </div>

          <div className="space-y-3 font-mono text-[11px]">
            <div className="p-3 rounded bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-between">
              <span className="text-[#666666]">Active Mode:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded uppercase ${
                  configStatus?.mode === "real"
                    ? "badge-policy-allowed"
                    : "badge-brand-orange"
                }`}
              >
                {configStatus?.mode === "real" ? "REAL LLM MODE" : "DEMO FALLBACK MODE"}
              </span>
            </div>

            <div className="p-3 rounded bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-between">
              <span className="text-[#666666]">LLM Provider:</span>
              <span className="font-bold text-[#111111] uppercase">
                {configStatus?.provider || "demo"}
              </span>
            </div>

            <div className="p-3 rounded bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-between">
              <span className="text-[#666666]">Model Name:</span>
              <span className="font-bold text-[#111111]">
                {configStatus?.model || "default"}
              </span>
            </div>

            <div className="p-3 rounded bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-between">
              <span className="text-[#666666]">API Key Configured:</span>
              <span className="font-bold text-[#111111]">
                {configStatus?.is_configured ? (
                  <span className="text-[#15803D] flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    YES ({configStatus.masked_key || "MASKED"})
                  </span>
                ) : (
                  <span className="text-[#C2410C] flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    NO (Running in Demo Fallback)
                  </span>
                )}
              </span>
            </div>

            <div className="p-3 rounded bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-between">
              <span className="text-[#666666]">Max Tool Iterations:</span>
              <span className="text-[#111111] font-bold">{configStatus?.max_iterations || 5}</span>
            </div>

            <div className="p-3 rounded bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-between">
              <span className="text-[#666666]">Request Timeout:</span>
              <span className="text-[#111111] font-bold">{configStatus?.timeout_seconds || 30}s</span>
            </div>
          </div>

          {/* Reset Database Section */}
          <div className="pt-3 border-t border-[#E5E5E5] space-y-3">
            <span className="font-display text-xs font-bold uppercase tracking-wider text-[#666666] block">
              Database & Test Harness Controls
            </span>
            <button
              onClick={handleResetData}
              disabled={resetting}
              className="w-full py-2.5 rounded bg-[#F7F7F7] hover:bg-[#EAEAEA] text-[#111111] border border-[#D1D5DB] font-bold text-xs font-sans uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin text-[#FFAC1C]" : ""}`} />
              <span>{resetting ? "Resetting Data..." : "Reset All Test & Audit Records"}</span>
            </button>
            {resetMsg && (
              <p className="text-[11px] text-[#15803D] font-mono font-bold text-center">{resetMsg}</p>
            )}
          </div>
        </div>

        {/* Right: How to configure Real LLM safely */}
        <div className="enterprise-card p-6 space-y-4 text-xs font-sans">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#FFAC1C]" />
              <h3 className="font-display text-base font-bold uppercase tracking-tight text-[#111111]">
                HOW TO CONFIGURE REAL LLM SAFELY
              </h3>
            </div>
            <button
              onClick={copyToClipboard}
              className="px-2.5 py-1 rounded bg-[#F3F4F6] text-[#111111] text-[11px] font-mono border border-[#D1D5DB] flex items-center gap-1 hover:bg-[#E5E7EB] cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? "Copied!" : "Copy .env Template"}</span>
            </button>
          </div>

          <p className="text-[#555555] leading-relaxed font-sans">
            To use Real LLM mode with OpenAI, Gemini, Anthropic, Groq, or Ollama, create a local <code className="text-[#111111] font-mono font-bold bg-[#F3F4F6] px-1 py-0.5 rounded">.env</code> file in the project root. The backend automatically reads and scrubs API keys.
          </p>

          <pre className="p-4 rounded bg-[#FAFAFA] border border-[#E5E5E5] text-[#222222] font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre">
            {envSample}
          </pre>

          <div className="space-y-2 pt-1 font-sans">
            <span className="font-bold text-[#111111] block">
              Supported Providers:
            </span>
            <ul className="space-y-1.5 text-[#555555] list-disc list-inside text-[11px]">
              <li>
                <strong className="text-[#111111]">OpenAI:</strong> Set <code className="font-mono text-[#111111]">LLM_PROVIDER=openai</code>, <code className="font-mono text-[#111111]">LLM_API_KEY=sk-...</code>, <code className="font-mono text-[#111111]">LLM_MODEL=gpt-4o-mini</code>.
              </li>
              <li>
                <strong className="text-[#111111]">Google Gemini:</strong> Set <code className="font-mono text-[#111111]">LLM_PROVIDER=gemini</code>, <code className="font-mono text-[#111111]">LLM_API_KEY=AIza...</code>, <code className="font-mono text-[#111111]">LLM_MODEL=gemini-1.5-flash</code>.
              </li>
              <li>
                <strong className="text-[#111111]">Anthropic Claude:</strong> Set <code className="font-mono text-[#111111]">LLM_PROVIDER=anthropic</code>, <code className="font-mono text-[#111111]">LLM_API_KEY=sk-ant-...</code>, <code className="font-mono text-[#111111]">LLM_MODEL=claude-3-5-sonnet-20241022</code>.
              </li>
              <li>
                <strong className="text-[#111111]">Groq:</strong> Set <code className="font-mono text-[#111111]">LLM_PROVIDER=groq</code>, <code className="font-mono text-[#111111]">LLM_API_KEY=gsk_...</code>, <code className="font-mono text-[#111111]">LLM_MODEL=llama-3.3-70b-versatile</code>.
              </li>
              <li>
                <strong className="text-[#111111]">Ollama (Local):</strong> Set <code className="font-mono text-[#111111]">LLM_PROVIDER=ollama</code>, <code className="font-mono text-[#111111]">LLM_MODEL=llama3.1</code> (no API key required).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
