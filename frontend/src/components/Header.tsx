import React from "react";
import { ShieldCheck, RotateCcw, Sparkles, Terminal } from "lucide-react";
import { ConfigStatus } from "../types";

interface HeaderProps {
  activeTab: string;
  configStatus: ConfigStatus | null;
  onResetData: () => void;
  resetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  configStatus,
  onResetData,
  resetting,
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: "SECURITY OVERVIEW",
      subtitle: "Autonomous defense gateway status, threat mitigation statistics, and audit activity.",
    },
    workspace: {
      title: "AGENT WORKSPACE",
      subtitle: "Execute AI agent tasks against untrusted external content with pre-execution authorization.",
    },
    "attack-lab": {
      title: "ATTACK LAB",
      subtitle: "Simulate indirect prompt injection vectors and observe protected gateway vs baseline behavior.",
    },
    "policy-center": {
      title: "POLICY CENTER",
      subtitle: "Server-side tool authorization rules, permission boundaries, and least-privilege controls.",
    },
    events: {
      title: "SECURITY EVENTS",
      subtitle: "Immutable server-side audit logs capturing tool proposals, decisions, and execution outcomes.",
    },
    evaluation: {
      title: "EVALUATION & BENCHMARKS",
      subtitle: "Empirical metrics comparing protected gateway defense against an unprotected baseline.",
    },
    settings: {
      title: "SYSTEM SETTINGS",
      subtitle: "Configure LLM provider, view masked credentials, and review safe setup guidelines.",
    },
  };

  const current = titles[activeTab] || {
    title: "PROMPTRAKSHAK",
    subtitle: "AI Agent Security Command Center",
  };

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#E5E5E5] px-8 flex items-center justify-between shrink-0 select-none">
      <div>
        <h1 className="font-display font-extrabold text-2xl tracking-tight text-[#111111] uppercase leading-none">
          {current.title}
        </h1>
        <p className="text-xs text-[#666666] mt-1 font-sans">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Mode Pill */}
        <div
          className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2 border ${
            configStatus?.mode === "real"
              ? "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
              : "bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]"
          }`}
        >
          {configStatus?.mode === "real" ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
              <span className="font-semibold">Real LLM: {configStatus?.model}</span>
            </>
          ) : (
            <>
              <Terminal className="w-3.5 h-3.5 text-[#EA580C]" />
              <span className="font-semibold">Demo Fallback Mode</span>
            </>
          )}
        </div>

        {/* Security Gateway Badge */}
        <div className="px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 bg-[#F9FAFB] border border-[#E5E7EB] text-[#111111]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
          <span className="font-semibold">GATEWAY: ACTIVE</span>
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={onResetData}
          disabled={resetting}
          title="Reset database runs, security events, and evaluations to clean state"
          className="px-3 py-1.5 rounded text-xs font-medium text-[#111111] bg-[#FFFFFF] hover:bg-[#F3F4F6] border border-[#D1D5DB] transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin text-[#FFAC1C]" : "text-[#666666]"}`} />
          <span>Reset Data</span>
        </button>
      </div>
    </header>
  );
};
