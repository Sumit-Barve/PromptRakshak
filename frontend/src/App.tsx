import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { OverviewPage } from "./pages/OverviewPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { AttackLabPage } from "./pages/AttackLabPage";
import { PolicyCenterPage } from "./pages/PolicyCenterPage";
import { EventsPage } from "./pages/EventsPage";
import { EvaluationPage } from "./pages/EvaluationPage";
import { SettingsPage } from "./pages/SettingsPage";
import {
  fetchConfigStatus,
  fetchEmails,
  fetchDocuments,
  fetchAttackScenarios,
  fetchPolicies,
  fetchSecurityEvents,
  resetDemoData,
} from "./api/client";
import {
  ConfigStatus,
  SyntheticEmail,
  SyntheticDocument,
  AttackScenario,
  PolicyRule,
  SecurityEvent,
} from "./types";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [emails, setEmails] = useState<SyntheticEmail[]>([]);
  const [documents, setDocuments] = useState<SyntheticDocument[]>([]);
  const [scenarios, setScenarios] = useState<AttackScenario[]>([]);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [resetting, setResetting] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [cfg, ems, docs, scens, pols, evts] = await Promise.all([
        fetchConfigStatus(),
        fetchEmails(),
        fetchDocuments(),
        fetchAttackScenarios(),
        fetchPolicies(),
        fetchSecurityEvents({ limit: 100 }),
      ]);
      setConfigStatus(cfg);
      setEmails(ems);
      setDocuments(docs);
      setScenarios(scens);
      setPolicies(pols);
      setEvents(evts);
    } catch (e) {
      console.error("Failed to load initial data:", e);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshEvents = async () => {
    try {
      const evts = await fetchSecurityEvents({ limit: 100 });
      setEvents(evts);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshPolicies = async () => {
    try {
      const pols = await fetchPolicies();
      setPolicies(pols);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshConfig = async () => {
    try {
      const cfg = await fetchConfigStatus();
      setConfigStatus(cfg);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      await resetDemoData();
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-3 border-[#FFAC1C] border-t-transparent rounded-full animate-spin" />
        <div className="font-display text-sm font-bold tracking-wider text-[#111111] uppercase">
          INITIALIZING PROMPTRAKSHAK SECURITY GATEWAY...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F7F7F7] text-[#171717] overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        configStatus={configStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          configStatus={configStatus}
          onResetData={handleResetData}
          resetting={resetting}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto bg-[#F7F7F7]">
          {activeTab === "overview" && (
            <OverviewPage
              events={events}
              configStatus={configStatus}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "workspace" && (
            <WorkspacePage
              emails={emails}
              documents={documents}
              configStatus={configStatus}
              onRefreshEvents={handleRefreshEvents}
            />
          )}

          {activeTab === "attack-lab" && (
            <AttackLabPage
              scenarios={scenarios}
              onRefreshEvents={handleRefreshEvents}
            />
          )}

          {activeTab === "policy-center" && (
            <PolicyCenterPage
              policies={policies}
              onRefreshPolicies={handleRefreshPolicies}
            />
          )}

          {activeTab === "events" && <EventsPage events={events} />}

          {activeTab === "evaluation" && <EvaluationPage />}

          {activeTab === "settings" && (
            <SettingsPage
              configStatus={configStatus}
              onRefreshConfig={handleRefreshConfig}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
