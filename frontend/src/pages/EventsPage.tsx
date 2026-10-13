import React, { useState } from "react";
import {
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Eye,
  X,
  FileJson,
} from "lucide-react";
import { SecurityEvent } from "../types";

interface EventsPageProps {
  events: SecurityEvent[];
}

export const EventsPage: React.FC<EventsPageProps> = ({ events }) => {
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const filtered = events.filter((e) => {
    if (filterDecision !== "ALL" && e.decision !== filterDecision) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTool = e.tool_name.toLowerCase().includes(q);
      const matchReason = e.policy_reason.toLowerCase().includes(q);
      const matchId = (e.run_id || "").toLowerCase().includes(q);
      if (!matchTool && !matchReason && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar with Filter & Search */}
      <div className="enterprise-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#888888] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tool, run ID, or reason..."
            className="w-full bg-[#FAFAFA] border border-[#D1D5DB] rounded pl-9 pr-3 py-2 text-xs text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#FFAC1C] font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#666666] mr-1 flex items-center gap-1 font-bold uppercase text-[11px]">
            <Filter className="w-3.5 h-3.5 text-[#FFAC1C]" />
            Filter:
          </span>
          <button
            onClick={() => setFilterDecision("ALL")}
            className={`px-3 py-1.5 rounded border transition-all cursor-pointer font-bold ${
              filterDecision === "ALL"
                ? "bg-[#111111] text-white border-[#111111]"
                : "bg-[#FFFFFF] text-[#666666] border-[#E5E5E5] hover:text-[#111111]"
            }`}
          >
            ALL ({events.length})
          </button>
          <button
            onClick={() => setFilterDecision("DENIED")}
            className={`px-3 py-1.5 rounded border transition-all cursor-pointer font-bold ${
              filterDecision === "DENIED"
                ? "badge-threat-blocked font-extrabold"
                : "bg-[#FFFFFF] text-[#B91C1C] border-[#FECACA] hover:bg-[#FEF2F2]"
            }`}
          >
            DENIED ({events.filter((e) => e.decision === "DENIED").length})
          </button>
          <button
            onClick={() => setFilterDecision("ALLOWED")}
            className={`px-3 py-1.5 rounded border transition-all cursor-pointer font-bold ${
              filterDecision === "ALLOWED"
                ? "badge-policy-allowed font-extrabold"
                : "bg-[#FFFFFF] text-[#15803D] border-[#BBF7D0] hover:bg-[#F0FDF4]"
            }`}
          >
            ALLOWED ({events.filter((e) => e.decision === "ALLOWED").length})
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="enterprise-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-[#888888] text-xs font-sans">
            No audit events matched the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#666666] font-mono text-[11px] uppercase">
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                  <th className="py-3 px-4 font-bold">Decision</th>
                  <th className="py-3 px-4 font-bold">Tool Name</th>
                  <th className="py-3 px-4 font-bold">Policy Rationale</th>
                  <th className="py-3 px-4 font-bold">Execution Status</th>
                  <th className="py-3 px-4 font-bold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {filtered.map((evt) => {
                  const isDenied = evt.decision === "DENIED";
                  return (
                    <tr key={evt.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#666666] whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 w-fit ${
                            isDenied ? "badge-threat-blocked" : "badge-policy-allowed"
                          }`}
                        >
                          {isDenied ? (
                            <>
                              <ShieldAlert className="w-3 h-3 text-[#DC2626]" />
                              DENIED
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3 text-[#15803D]" />
                              ALLOWED
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                        {evt.tool_name}
                      </td>

                      <td className="py-3.5 px-4 text-[#444444] text-[11px] leading-relaxed max-w-md">
                        {evt.policy_reason}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#666666]">
                        {evt.execution_status}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="px-2.5 py-1 rounded bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111111] text-[11px] font-mono transition-all inline-flex items-center gap-1 border border-[#D1D5DB] cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-[#666666]" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Details Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#D1D5DB] rounded-lg w-full max-w-xl p-6 space-y-4 shadow-xl relative text-xs font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-[#FFAC1C]" />
                <h3 className="font-display text-base font-bold text-[#111111] uppercase tracking-tight">
                  AUDIT EVENT INSPECTOR: {selectedEvent.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded text-[#888888] hover:text-[#111111] hover:bg-[#F3F4F6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div className="p-3 rounded bg-[#FAFAFA] border border-[#E5E5E5]">
                  <span className="text-[#888888] block text-[10px] uppercase font-bold">Tool Name</span>
                  <span className="font-bold text-[#111111] text-xs">{selectedEvent.tool_name}</span>
                </div>
                <div className="p-3 rounded bg-[#FAFAFA] border border-[#E5E5E5]">
                  <span className="text-[#888888] block text-[10px] uppercase font-bold">Gateway Decision</span>
                  <span
                    className={
                      selectedEvent.decision === "DENIED"
                        ? "text-[#B91C1C] font-bold text-xs"
                        : "text-[#15803D] font-bold text-xs"
                    }
                  >
                    {selectedEvent.decision}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block mb-1">
                  Policy Rationale:
                </span>
                <div className="p-3 rounded bg-[#FAFAFA] border border-[#E5E5E5] text-[#222222]">
                  {selectedEvent.policy_reason}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-[#666666] uppercase block mb-1">
                  Proposed Arguments:
                </span>
                <pre className="p-3 rounded bg-[#FAFAFA] border border-[#E5E5E5] text-[#111111] font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedEvent.arguments, null, 2)}
                </pre>
              </div>

              <div className="text-[11px] text-[#888888] font-mono flex items-center justify-between pt-2 border-t border-[#E5E5E5]">
                <span>Run ID: {selectedEvent.run_id || "N/A"}</span>
                <span>Timestamp: {new Date(selectedEvent.timestamp).toISOString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
