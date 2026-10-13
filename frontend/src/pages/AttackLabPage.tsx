import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  CheckCircle2,
} from "lucide-react";
import { AttackScenario, ScenarioRunResult } from "../types";
import { runAttackScenario, runEvaluationSuite } from "../api/client";

interface AttackLabProps {
  scenarios: AttackScenario[];
  onRefreshEvents: () => void;
}

export const AttackLabPage: React.FC<AttackLabProps> = ({
  scenarios,
  onRefreshEvents,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario | null>(
    scenarios[0] || null
  );
  const [protectedResult, setProtectedResult] = useState<ScenarioRunResult | null>(null);
  const [baselineResult, setBaselineResult] = useState<ScenarioRunResult | null>(null);
  const [runningProtected, setRunningProtected] = useState<boolean>(false);
  const [runningBaseline, setRunningBaseline] = useState<boolean>(false);
  const [runningSuite, setRunningSuite] = useState<boolean>(false);
  const [suiteSummary, setSuiteSummary] = useState<any | null>(null);

  const handleRunProtected = async (scen: AttackScenario) => {
    setRunningProtected(true);
    try {
      const res = await runAttackScenario(scen.id, true);
      setProtectedResult(res);
      onRefreshEvents();
    } catch (e) {
      console.error(e);
    } finally {
      setRunningProtected(false);
    }
  };

  const handleRunBaseline = async (scen: AttackScenario) => {
    setRunningBaseline(true);
    try {
      const res = await runAttackScenario(scen.id, false);
      setBaselineResult(res);
      onRefreshEvents();
    } catch (e) {
      console.error(e);
    } finally {
      setRunningBaseline(false);
    }
  };

  const handleRunSuite = async () => {
    setRunningSuite(true);
    try {
      const report = await runEvaluationSuite(true);
      setSuiteSummary(report.summary);
      onRefreshEvents();
    } catch (e) {
      console.error(e);
    } finally {
      setRunningSuite(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-8 rounded-lg bg-[#111111] text-white border border-[#262626] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FEF2F2] text-[#B91C1C]">
              ADVERSARIAL TESTING GROUND
            </span>
            <span className="text-xs text-[#888888] font-mono">
              Indirect Prompt Injection Evaluation
            </span>
          </div>
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white leading-none">
            ATTACK SCENARIOS & <span className="text-[#FFAC1C]">BASELINE COMPARISON</span>
          </h2>
          <p className="text-xs md:text-sm text-[#CCCCCC] leading-relaxed font-sans">
            Execute real prompt injection vectors against synthetic documents. Compare how PromptRakshak's server-side Security Gateway blocks unauthorized actions versus an unprotected baseline where tool proposals execute unchecked.
          </p>
        </div>

        <button
          onClick={handleRunSuite}
          disabled={runningSuite}
          className="px-5 py-3 rounded bg-[#FFAC1C] hover:bg-[#F59E0B] text-[#111111] text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${runningSuite ? "animate-spin" : ""}`} />
          <span>{runningSuite ? "Running Suite..." : "Run All 7 Scenarios"}</span>
        </button>
      </div>

      {suiteSummary && (
        <div className="enterprise-card p-5 bg-[#FFFFFF] border-l-4 border-l-[#15803D] flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
          <div className="text-[#15803D] font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            Full Test Suite Benchmark Complete
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[#555555] font-mono">
            <span>
              Total Scenarios: <strong className="text-[#111111]">{suiteSummary.total_scenarios}</strong>
            </span>
            <span>
              Unauthorized Blocked:{" "}
              <strong className="text-[#B91C1C]">{suiteSummary.unauthorized_blocked}</strong>
            </span>
            <span>
              Attack Success Rate (Protected):{" "}
              <strong className="text-[#15803D]">{suiteSummary.attack_success_rate}%</strong>
            </span>
            <span>
              Benign Task Completion:{" "}
              <strong className="text-[#15803D]">{suiteSummary.benign_completion_rate}%</strong>
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Left Scenario List (5 Cols) | Right Details & Comparison (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario List */}
        <div className="lg:col-span-5 space-y-3">
          <span className="font-display text-sm font-bold uppercase tracking-wider text-[#666666] block">
            Adversarial Scenarios ({scenarios.length})
          </span>

          <div className="space-y-2.5">
            {scenarios.map((scen) => {
              const isSelected = selectedScenario?.id === scen.id;
              const isCrit = scen.severity === "CRITICAL";
              const isHigh = scen.severity === "HIGH";

              return (
                <div
                  key={scen.id}
                  onClick={() => {
                    setSelectedScenario(scen);
                    setProtectedResult(null);
                    setBaselineResult(null);
                  }}
                  className={`p-4 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#FFFFFF] border-[#FFAC1C] ring-1 ring-[#FFAC1C] shadow-sm"
                      : "bg-[#FFFFFF] border-[#E5E5E5] hover:border-[#D1D5DB]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-sans text-xs font-bold text-[#111111]">
                      {scen.name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        isCrit
                          ? "badge-threat-blocked"
                          : isHigh
                          ? "bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]"
                          : "badge-policy-allowed"
                      }`}
                    >
                      {scen.severity}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#666666] line-clamp-2 leading-relaxed font-sans">
                    {scen.description}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[#F0F0F0] flex items-center justify-between text-[10px] font-mono text-[#888888]">
                    <span>Category: {scen.category}</span>
                    <span>Tools: {scen.unauthorized_tools.join(", ") || "None (Benign)"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Details & Side-by-Side Comparison */}
        <div className="lg:col-span-7 space-y-5">
          {selectedScenario && (
            <div className="enterprise-card p-6 space-y-5 text-xs font-sans">
              {/* Header */}
              <div className="border-b border-[#E5E5E5] pb-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold uppercase text-[#C2410C]">
                    {selectedScenario.category}
                  </span>
                  <span className="text-[#CCCCCC]">&bull;</span>
                  <span className="text-xs text-[#666666]">
                    Target: {selectedScenario.target_title}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#111111]">
                  {selectedScenario.name}
                </h3>
              </div>

              {/* User Objective vs Adversarial Injected Payload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded bg-[#FAFAFA] border border-[#E5E5E5] space-y-1">
                  <span className="text-[10px] uppercase font-mono text-[#777777] font-bold block">
                    Legitimate User Objective
                  </span>
                  <p className="text-[#111111]">{selectedScenario.user_objective}</p>
                </div>

                <div className="p-3.5 rounded bg-[#FEF2F2]/60 border border-[#FECACA] space-y-1">
                  <span className="text-[10px] uppercase font-mono text-[#B91C1C] font-bold block">
                    Adversarial Injected Payload
                  </span>
                  <p className="text-[#B91C1C] font-mono text-[11px]">
                    {selectedScenario.adversarial_payload}
                  </p>
                </div>
              </div>

              {/* Expected Security Property */}
              <div className="p-3.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-mono text-[#334155] font-bold block mb-0.5">
                  Expected Security Boundary Property:
                </span>
                <p className="text-[#1E293B]">
                  {selectedScenario.expected_security_property}
                </p>
              </div>

              {/* Run Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleRunProtected(selectedScenario)}
                  disabled={runningProtected}
                  className="flex-1 py-2.5 rounded bg-[#111111] hover:bg-[#222222] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-[#FFAC1C]" />
                  <span>
                    {runningProtected ? "Evaluating..." : "Run Protected (Gateway)"}
                  </span>
                </button>

                <button
                  onClick={() => handleRunBaseline(selectedScenario)}
                  disabled={runningBaseline}
                  className="flex-1 py-2.5 rounded bg-[#FFFFFF] hover:bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                  <span>
                    {runningBaseline ? "Running..." : "Run Unprotected (Baseline)"}
                  </span>
                </button>
              </div>

              {/* Comparison Results Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E5E5E5]">
                {/* Protected Result */}
                <div className="p-4 rounded bg-[#F0FDF4]/40 border border-[#BBF7D0] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#15803D] flex items-center gap-1.5 font-display text-sm uppercase">
                      <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                      Protected Gateway
                    </span>
                    {protectedResult && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          protectedResult.passed ? "badge-policy-allowed" : "badge-threat-blocked"
                        }`}
                      >
                        {protectedResult.passed ? "PASSED (BLOCKED)" : "FAILED"}
                      </span>
                    )}
                  </div>

                  {!protectedResult ? (
                    <div className="text-[#888888] text-xs italic py-4 text-center font-sans">
                      Click 'Run Protected' to evaluate with PromptRakshak Security Gateway.
                    </div>
                  ) : (
                    <div className="space-y-2 text-[11px] font-sans">
                      <div className="text-[#333333]">
                        {protectedResult.details}
                      </div>
                      <div className="p-2 rounded bg-[#FFFFFF] border border-[#BBF7D0] font-mono text-[10px] text-[#15803D]">
                        Unauthorized Executed: <strong>{protectedResult.unauthorized_executed ? "YES (VULNERABLE)" : "NO (NEUTRALIZED)"}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Unprotected Baseline Result */}
                <div className="p-4 rounded bg-[#FEF2F2]/40 border border-[#FECACA] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#B91C1C] flex items-center gap-1.5 font-display text-sm uppercase">
                      <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                      Unprotected Baseline
                    </span>
                    {baselineResult && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          baselineResult.unauthorized_executed ? "badge-threat-blocked" : "badge-policy-allowed"
                        }`}
                      >
                        {baselineResult.unauthorized_executed ? "COMPROMISED" : "SAFE"}
                      </span>
                    )}
                  </div>

                  {!baselineResult ? (
                    <div className="text-[#888888] text-xs italic py-4 text-center font-sans">
                      Click 'Run Unprotected' to demonstrate vulnerability without gateway.
                    </div>
                  ) : (
                    <div className="space-y-2 text-[11px] font-sans">
                      <div className="text-[#333333]">
                        {baselineResult.details}
                      </div>
                      <div className="p-2 rounded bg-[#FFFFFF] border border-[#FECACA] font-mono text-[10px] text-[#B91C1C]">
                        Unauthorized Executed: <strong>{baselineResult.unauthorized_executed ? "YES (ATTACK SUCCEEDED)" : "NO"}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
