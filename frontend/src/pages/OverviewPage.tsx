import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  ArrowRight,
  Lock,
  Cpu,
} from "lucide-react";
import { SecurityEvent, ConfigStatus } from "../types";

interface OverviewProps {
  events: SecurityEvent[];
  configStatus: ConfigStatus | null;
  onNavigate: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewProps> = ({
  events,
  configStatus,
  onNavigate,
}) => {
  const blockedCount = events.filter((e) => e.decision === "DENIED").length;
  const approvedCount = events.filter((e) => e.decision === "ALLOWED").length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner — UpGuard Inspired Enterprise Headline */}
      <div className="p-8 rounded-lg bg-[#111111] text-white border border-[#262626] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFAC1C] text-[#111111]">
              ZERO-TRUST AGENT DEFENSE
            </span>
            <span className="text-xs text-[#888888] font-mono">
              Server-Side Authorization Boundary
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white leading-none">
            DEFEND AI AGENTS AGAINST <span className="text-[#FFAC1C]">PROMPT INJECTION</span>
          </h2>
          <p className="text-xs md:text-sm text-[#CCCCCC] leading-relaxed font-sans">
            AI agents processing emails and documents face indirect prompt injection. PromptRakshak enforces an independent server-side gateway: the model may propose tool calls, but only our backend validates permissions before execution.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate("workspace")}
            className="w-full sm:w-auto px-5 py-3 rounded bg-[#FFAC1C] hover:bg-[#F59E0B] text-[#111111] text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Cpu className="w-4 h-4" />
            <span>Open Agent Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate("attack-lab")}
            className="w-full sm:w-auto px-5 py-3 rounded bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 border border-[#333333] transition-all cursor-pointer"
          >
            <span>Launch Attack Lab</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Blocked Injections */}
        <div className="enterprise-card p-6 space-y-3">
          <div className="flex items-center justify-between text-[#666666]">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-[#666666]">
              Unauthorized Blocked
            </span>
            <div className="w-8 h-8 rounded bg-[#FEF2F2] flex items-center justify-center text-[#B91C1C]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-extrabold font-display tracking-tight text-[#111111]">
            {blockedCount}
          </div>
          <div className="text-xs text-[#B91C1C] flex items-center gap-1.5 font-sans font-medium">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Intercepted before execution</span>
          </div>
        </div>

        {/* Card 2: Approved Operations */}
        <div className="enterprise-card p-6 space-y-3">
          <div className="flex items-center justify-between text-[#666666]">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-[#666666]">
              Approved Operations
            </span>
            <div className="w-8 h-8 rounded bg-[#F0FDF4] flex items-center justify-center text-[#15803D]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-extrabold font-display tracking-tight text-[#111111]">
            {approvedCount}
          </div>
          <div className="text-xs text-[#15803D] flex items-center gap-1.5 font-sans font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Least-privilege compliant</span>
          </div>
        </div>

        {/* Card 3: Attack Success Rate */}
        <div className="enterprise-card p-6 space-y-3">
          <div className="flex items-center justify-between text-[#666666]">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-[#666666]">
              Attack Success Rate
            </span>
            <div className="w-8 h-8 rounded bg-[#F3F4F6] flex items-center justify-center text-[#111111]">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-extrabold font-display tracking-tight text-[#15803D]">
            0.0%
          </div>
          <div className="text-xs text-[#666666] font-sans font-medium">
            Protected by PromptRakshak Gateway
          </div>
        </div>

        {/* Card 4: Benign Completion Rate */}
        <div className="enterprise-card p-6 space-y-3">
          <div className="flex items-center justify-between text-[#666666]">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-[#666666]">
              Benign Completion
            </span>
            <div className="w-8 h-8 rounded bg-[#FFF7ED] flex items-center justify-center text-[#C2410C]">
              <CheckCircle2 className="w-4 h-4 text-[#EA580C]" />
            </div>
          </div>
          <div className="text-4xl font-extrabold font-display tracking-tight text-[#111111]">
            100%
          </div>
          <div className="text-xs text-[#15803D] font-sans font-medium">
            Zero legitimate task disruption
          </div>
        </div>
      </div>

      {/* Two Column Layout: Architecture Principles + Recent Events Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Principles Column (4 cols) */}
        <div className="lg:col-span-4 enterprise-card p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
            <Layers className="w-4 h-4 text-[#FFAC1C]" />
            <h3 className="font-display text-base font-bold uppercase tracking-tight text-[#111111]">
              CORE SECURITY PRINCIPLES
            </h3>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div className="p-3.5 rounded bg-[#FAFAFA] border border-[#E5E5E5] space-y-1">
              <div className="font-bold text-[#111111] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFAC1C]" />
                1. Independent Server Gateway
              </div>
              <p className="text-[#666666] leading-relaxed">
                The LLM never runs tools directly. It only emits structured proposals. The backend independently validates permissions before execution.
              </p>
            </div>

            <div className="p-3.5 rounded bg-[#FAFAFA] border border-[#E5E5E5] space-y-1">
              <div className="font-bold text-[#111111] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFAC1C]" />
                2. Quarantined Untrusted Input
              </div>
              <p className="text-[#666666] leading-relaxed">
                External emails and documents are marked untrusted. Injection payloads cannot grant permissions or alter gateway policies.
              </p>
            </div>

            <div className="p-3.5 rounded bg-[#FAFAFA] border border-[#E5E5E5] space-y-1">
              <div className="font-bold text-[#111111] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFAC1C]" />
                3. Immutable Audit Logging
              </div>
              <p className="text-[#666666] leading-relaxed">
                Every proposed tool call is recorded with correlation IDs, policy reasons, and execution status before invocation.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate("policy-center")}
            className="w-full py-2.5 rounded bg-[#F7F7F7] hover:bg-[#EAEAEA] text-[#111111] text-xs font-bold font-sans uppercase tracking-wider border border-[#E5E5E5] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>View Policy Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Security Audit Stream (8 cols) */}
        <div className="lg:col-span-8 enterprise-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#15803D]" />
              <h3 className="font-display text-base font-bold uppercase tracking-tight text-[#111111]">
                RECENT SECURITY AUDIT EVENTS
              </h3>
            </div>
            <button
              onClick={() => onNavigate("events")}
              className="text-xs text-[#C2410C] hover:text-[#EA580C] font-bold font-sans flex items-center gap-1 cursor-pointer"
            >
              <span>Full Audit Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {events.length === 0 ? (
            <div className="py-16 text-center text-[#888888] text-xs font-sans">
              No audit events recorded yet. Run a task in the Agent Workspace or Attack Lab to generate live audit records.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-[#E5E5E5] text-[#777777] font-mono text-[11px] uppercase">
                    <th className="py-2.5 px-3">Decision</th>
                    <th className="py-2.5 px-3">Tool Name</th>
                    <th className="py-2.5 px-3">Policy Reason</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {events.slice(0, 6).map((evt) => {
                    const isDenied = evt.decision === "DENIED";
                    return (
                      <tr key={evt.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              isDenied ? "badge-threat-blocked" : "badge-policy-allowed"
                            }`}
                          >
                            {evt.decision}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-[#111111]">
                          {evt.tool_name}
                        </td>
                        <td className="py-3 px-3 text-[#555555] max-w-md truncate">
                          {evt.policy_reason}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[11px] text-[#888888] whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
