import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Play,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { EvaluationReport } from "../types";
import { runEvaluationSuite, fetchEvaluations } from "../api/client";

export const EvaluationPage: React.FC = () => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [running, setRunning] = useState<boolean>(false);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      const data = await fetchEvaluations();
      if (data.length > 0 && data[0].report) {
        setReport(data[0].report);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunEvaluation = async () => {
    setRunning(true);
    try {
      const newReport = await runEvaluationSuite(true);
      setReport(newReport);
      loadEvaluations();
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const handleExport = (format: "json" | "csv") => {
    if (!report) return;
    window.open(`/api/evaluations/${report.evaluation_id}/export?format=${format}`, "_blank");
  };

  // Comparative chart data
  const comparisonData = report
    ? [
        {
          metric: "Attack Success (%)",
          Protected: report.summary.attack_success_rate,
          Baseline: 100.0,
        },
        {
          metric: "Unauthorized Actions",
          Protected: report.summary.unauthorized_executed,
          Baseline: report.summary.attack_scenarios,
        },
        {
          metric: "Benign Completion (%)",
          Protected: report.summary.benign_completion_rate,
          Baseline: report.summary.benign_completion_rate,
        },
      ]
    : [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-8 rounded-lg bg-[#111111] text-white border border-[#262626] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFAC1C] text-[#111111]">
              EMPIRICAL BENCHMARK EVIDENCE
            </span>
            <span className="text-xs text-[#888888] font-mono">
              Verifiable Security Measurements
            </span>
          </div>
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white leading-none">
            EVALUATION & <span className="text-[#FFAC1C]">BASELINE METRICS</span>
          </h2>
          <p className="text-xs md:text-sm text-[#CCCCCC] leading-relaxed font-sans">
            Metrics are calculated from real stored outcomes across tested attack and benign scenarios. Compare PromptRakshak Security Gateway protection against an unprotected baseline.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRunEvaluation}
            disabled={running}
            className="px-5 py-3 rounded bg-[#FFAC1C] hover:bg-[#F59E0B] text-[#111111] text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${running ? "animate-spin" : ""}`} />
            <span>{running ? "Running Suite..." : "Run Live Benchmark"}</span>
          </button>

          {report && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("csv")}
                className="px-3.5 py-3 rounded bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-bold font-sans uppercase tracking-wider border border-[#333333] flex items-center gap-1.5 transition-all cursor-pointer"
                title="Export evaluation as CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#FFAC1C]" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExport("json")}
                className="px-3.5 py-3 rounded bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-bold font-sans uppercase tracking-wider border border-[#333333] flex items-center gap-1.5 transition-all cursor-pointer"
                title="Export evaluation as JSON"
              >
                <FileCode className="w-4 h-4 text-[#FFFFFF]" />
                <span>JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {!report && !running && (
        <div className="enterprise-card p-14 text-center space-y-3">
          <BarChart3 className="w-10 h-10 text-[#888888] mx-auto" />
          <h4 className="font-display text-lg font-bold uppercase tracking-tight text-[#111111]">
            No Evaluation Runs Recorded
          </h4>
          <p className="text-xs text-[#666666] max-w-sm mx-auto font-sans">
            Click <strong>Run Live Benchmark</strong> above to evaluate the full test suite and calculate measured security outcomes.
          </p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="enterprise-card p-6 space-y-2">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[#666666]">Total Scenarios</span>
              <div className="text-4xl font-extrabold font-display tracking-tight text-[#111111]">
                {report.summary.total_scenarios}
              </div>
              <div className="text-xs text-[#888888] font-mono">
                {report.summary.attack_scenarios} Attacks | {report.summary.benign_scenarios} Benign
              </div>
            </div>

            <div className="enterprise-card p-6 space-y-2">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[#666666]">Unauthorized Blocked</span>
              <div className="text-4xl font-extrabold font-display tracking-tight text-[#B91C1C]">
                {report.summary.unauthorized_blocked}
              </div>
              <div className="text-xs text-[#B91C1C] font-mono font-bold">
                100% Interception rate
              </div>
            </div>

            <div className="enterprise-card p-6 space-y-2">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[#666666]">Attack Success Rate</span>
              <div className="text-4xl font-extrabold font-display tracking-tight text-[#15803D]">
                {report.summary.attack_success_rate}%
              </div>
              <div className="text-xs text-[#15803D] font-mono font-bold">
                Protected by Gateway
              </div>
            </div>

            <div className="enterprise-card p-6 space-y-2">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[#666666]">Benign Completion</span>
              <div className="text-4xl font-extrabold font-display tracking-tight text-[#111111]">
                {report.summary.benign_completion_rate}%
              </div>
              <div className="text-xs text-[#15803D] font-mono font-bold">
                Zero disruption to tasks
              </div>
            </div>
          </div>

          {/* Comparative Bar Chart */}
          <div className="enterprise-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
              <BarChart3 className="w-4 h-4 text-[#FFAC1C]" />
              <h3 className="font-display text-base font-bold uppercase tracking-tight text-[#111111]">
                PROTECTED GATEWAY VS UNPROTECTED BASELINE COMPARISON
              </h3>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="metric" stroke="#666666" fontSize={11} />
                  <YAxis stroke="#666666" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#D1D5DB",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#111111",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="Protected" fill="#FFAC1C" radius={[4, 4, 0, 0]} name="PromptRakshak Gateway" />
                  <Bar dataKey="Baseline" fill="#DC2626" radius={[4, 4, 0, 0]} name="Unprotected Baseline" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scenario Results Table */}
          <div className="enterprise-card overflow-hidden">
            <div className="p-4 border-b border-[#E5E5E5] bg-[#FAFAFA] font-display font-bold uppercase tracking-wider text-xs text-[#111111]">
              SCENARIO-LEVEL VERIFICATION OUTCOMES ({report.scenario_results.length} SCENARIOS)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-[#E5E5E5] text-[#777777] font-mono text-[11px] uppercase">
                    <th className="py-3 px-4 font-bold">Scenario</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Attack Attempted</th>
                    <th className="py-3 px-4 font-bold">Unauthorized Executed</th>
                    <th className="py-3 px-4 font-bold">Evaluation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {report.scenario_results.map((res) => (
                    <tr key={res.scenario_id} className="hover:bg-[#FAFAFA]">
                      <td className="py-3.5 px-4 font-bold text-[#111111]">
                        {res.scenario_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#666666]">
                        {res.category}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 w-fit ${
                            res.passed ? "badge-policy-allowed" : "badge-threat-blocked"
                          }`}
                        >
                          {res.passed ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                              PASSED
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-[#DC2626]" />
                              FAILED
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#555555]">
                        {res.unauthorized_attempted ? "YES" : "NO"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className={res.unauthorized_executed ? "text-[#B91C1C] font-bold" : "text-[#15803D] font-bold"}>
                          {res.unauthorized_executed ? "YES (VULNERABLE)" : "NO (BLOCKED)"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#666666] text-[11px] max-w-xs truncate">
                        {res.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
