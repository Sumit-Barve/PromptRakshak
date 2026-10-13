import React, { useState } from "react";
import {
  RotateCcw,
  Save,
  CheckCircle2,
} from "lucide-react";
import { PolicyRule } from "../types";
import { updatePolicyRule, resetPolicies } from "../api/client";

interface PolicyCenterProps {
  policies: PolicyRule[];
  onRefreshPolicies: () => void;
}

export const PolicyCenterPage: React.FC<PolicyCenterProps> = ({
  policies,
  onRefreshPolicies,
}) => {
  const [editingPolicies, setEditingPolicies] = useState<Record<string, { default_policy: any; is_active: boolean }>>({});
  const [savingTool, setSavingTool] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const handlePolicyChange = (toolName: string, field: "default_policy" | "is_active", value: any) => {
    const current = policies.find((p) => p.tool_name === toolName);
    if (!current) return;

    setEditingPolicies((prev) => ({
      ...prev,
      [toolName]: {
        default_policy: field === "default_policy" ? value : prev[toolName]?.default_policy ?? current.default_policy,
        is_active: field === "is_active" ? value : prev[toolName]?.is_active ?? Boolean(current.is_active),
      },
    }));
  };

  const handleSave = async (toolName: string) => {
    const edit = editingPolicies[toolName];
    if (!edit) return;

    setSavingTool(toolName);
    try {
      await updatePolicyRule(toolName, {
        default_policy: edit.default_policy,
        is_active: edit.is_active,
      });
      setMsg(`Updated policy for '${toolName}'.`);
      onRefreshPolicies();
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setSavingTool(null);
    }
  };

  const handleResetDefaults = async () => {
    try {
      await resetPolicies();
      setEditingPolicies({});
      onRefreshPolicies();
      setMsg("All policies reset to safe default configuration.");
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-8 rounded-lg bg-[#111111] text-white border border-[#262626] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFAC1C] text-[#111111]">
              LEAST-PRIVILEGE AUTHORIZATION
            </span>
            <span className="text-xs text-[#888888] font-mono">
              Server-Side Enforcement Engine
            </span>
          </div>
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white leading-none">
            SECURITY POLICY & <span className="text-[#FFAC1C]">PERMISSION MATRIX</span>
          </h2>
          <p className="text-xs md:text-sm text-[#CCCCCC] leading-relaxed font-sans">
            Registered tools and their strict authorization policies. Server rules are independently evaluated and cannot be overridden by document text or indirect prompt injections.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-4 py-2.5 rounded bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-bold font-sans uppercase tracking-wider border border-[#333333] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#AAAAAA]" />
          <span>Reset Safe Defaults</span>
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs font-sans font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          <span>{msg}</span>
        </div>
      )}

      {/* Policies Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#666666] font-mono text-[11px] uppercase">
                <th className="py-3 px-4 font-bold">Tool Name</th>
                <th className="py-3 px-4 font-bold">Permission Scope</th>
                <th className="py-3 px-4 font-bold">Gateway Policy</th>
                <th className="py-3 px-4 font-bold">Enforcement Policy Rationale</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {policies.map((p) => {
                const edit = editingPolicies[p.tool_name];
                const currentPolicy = edit?.default_policy ?? p.default_policy;
                const isRestricted = currentPolicy === "DENY";
                const isModified = edit !== undefined;

                return (
                  <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                    {/* Tool Name */}
                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-[#111111] text-xs">
                        {p.tool_name}
                      </div>
                      <div className="text-[11px] text-[#666666] mt-0.5 font-sans">
                        {p.description}
                      </div>
                    </td>

                    {/* Permission & Resource */}
                    <td className="py-4 px-4 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[#111111] border border-[#E5E7EB] font-medium">
                        {p.permission_required}
                      </span>
                      <div className="text-[10px] text-[#888888] mt-1 font-mono">
                        Scope: {p.resource_scope}
                      </div>
                    </td>

                    {/* Default Policy Selector */}
                    <td className="py-4 px-4">
                      <select
                        value={currentPolicy}
                        onChange={(e) =>
                          handlePolicyChange(p.tool_name, "default_policy", e.target.value)
                        }
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold border focus:outline-none cursor-pointer ${
                          isRestricted
                            ? "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]"
                            : "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
                        }`}
                      >
                        <option value="ALLOW">ALLOW</option>
                        <option value="DENY">DENY (BLOCKED)</option>
                      </select>
                    </td>

                    {/* Rationale */}
                    <td className="py-4 px-4 text-[#444444] text-[11px] leading-relaxed max-w-md font-sans">
                      {p.reason}
                    </td>

                    {/* Save Action */}
                    <td className="py-4 px-4 text-right">
                      {isModified && (
                        <button
                          onClick={() => handleSave(p.tool_name)}
                          disabled={savingTool === p.tool_name}
                          className="px-3 py-1.5 rounded bg-[#FFAC1C] hover:bg-[#F59E0B] text-[#111111] text-xs font-bold font-sans uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto shadow-xs cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingTool === p.tool_name ? "Saving..." : "Save"}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
