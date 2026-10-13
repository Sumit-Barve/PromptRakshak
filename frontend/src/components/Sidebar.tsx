import React from "react";
import {
  ShieldCheck,
  Cpu,
  Flame,
  Activity,
  BarChart3,
  Sliders,
  Radio,
  Lock,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  configStatus: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  configStatus,
}) => {
  const navItems = [
    { id: "overview", label: "Security Overview", icon: ShieldCheck, badge: "Live" },
    { id: "workspace", label: "Agent Workspace", icon: Cpu, badge: null },
    { id: "attack-lab", label: "Attack Lab", icon: Flame, badge: "7 Tests" },
    { id: "policy-center", label: "Policy Center", icon: Lock, badge: null },
    { id: "events", label: "Security Events", icon: Activity, badge: null },
    { id: "evaluation", label: "Evaluation", icon: BarChart3, badge: null },
    { id: "settings", label: "Settings", icon: Sliders, badge: null },
  ];

  return (
    <aside className="w-64 bg-[#111111] border-r border-[#222222] flex flex-col justify-between shrink-0 select-none text-white">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#222222] flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#FFAC1C] flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-[#111111]" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display tracking-tight text-lg text-white font-extrabold flex items-center gap-1.5 leading-none">
              PROMPT<span className="text-[#FFAC1C]">RAKSHAK</span>
            </div>
            <div className="text-[10px] text-[#888888] font-mono tracking-wider uppercase mt-1">
              AI Security Gateway
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-5 pb-2 text-[10px] font-mono text-[#777777] uppercase tracking-wider">
          Navigation
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#222222] text-[#FFAC1C] font-semibold border-l-2 border-[#FFAC1C]"
                    : "text-[#AAAAAA] hover:text-white hover:bg-[#1A1A1A] border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#FFAC1C]" : "text-[#777777]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive
                        ? "bg-[#FFAC1C]/20 text-[#FFAC1C] font-semibold"
                        : "bg-[#222222] text-[#888888]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[#222222] bg-[#0A0A0A] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#888888] flex items-center gap-1.5 font-mono">
            <Radio className="w-3 h-3 text-[#15803D] animate-pulse" />
            Gateway Status
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#15803D]/20 text-[#22C55E] font-mono font-bold">
            ENFORCING
          </span>
        </div>

        <div className="text-[11px] text-[#888888] font-mono truncate">
          Provider: <span className="text-[#DDDDDD] font-semibold">{configStatus?.provider || "demo"}</span>
        </div>

        <div className="text-[11px] text-[#888888] font-mono truncate">
          Mode:{" "}
          <span
            className={
              configStatus?.mode === "real" ? "text-[#22C55E] font-semibold" : "text-[#FFAC1C] font-semibold"
            }
          >
            {configStatus?.mode === "real" ? "Real LLM Mode" : "Demo Fallback"}
          </span>
        </div>
      </div>
    </aside>
  );
};
