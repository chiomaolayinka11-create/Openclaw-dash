import React, { useState } from "react";
import { 
  X, 
  Globe, 
  Settings, 
  Layers, 
  Cpu, 
  Smartphone, 
  Database,
  Users,
  Compass
} from "lucide-react";
import EnvironmentStatus from "./EnvironmentStatus";
import MemoryConsole from "./MemoryConsole";
import SkillsLibrary from "./SkillsLibrary";
import ArmyManager from "./ArmyManager";
import SandboxConsole from "./SandboxConsole";
import McpTermuxBridge from "./McpTermuxBridge";
import { SystemStatus, AgentSkill, MemoryEntry } from "../types";

interface SystemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatus | null;
  reports: Array<{ name: string; size: number; updatedAt: string; contentSample: string }>;
  apiKeyConfigured: boolean;
  selectedReport: string | null;
  onRefreshTelemetry: () => void;
  onSelectReport: (name: string) => void;
  onDeleteReport: (name: string) => void;
  onCreateReportFile: (name: string) => void;
  memories: MemoryEntry[];
  onCreateMemory: (m: { content: string, category: string }) => void;
  onDeleteMemory: (id: string) => void;
  skills: AgentSkill[];
  onCreateSkill: (skill: { name: string; description: string; systemPrompt: string; codeSnippet: string; category: "system" | "custom" | "browser" | "database" }) => void;
  onDeleteSkill: (id: string) => void;
  showEnvPanel?: boolean;
  setShowEnvPanel?: (v: boolean) => void;
  showThreadsPanel?: boolean;
  setShowThreadsPanel?: (v: boolean) => void;
  showApprovalsPanel?: boolean;
  setShowApprovalsPanel?: (v: boolean) => void;
}

export default function SystemDrawer({
  isOpen,
  onClose,
  status,
  reports,
  apiKeyConfigured,
  selectedReport,
  onRefreshTelemetry,
  onSelectReport,
  onDeleteReport,
  onCreateReportFile,
  memories,
  onCreateMemory,
  onDeleteMemory,
  skills,
  onCreateSkill,
  onDeleteSkill,
  showEnvPanel = false,
  setShowEnvPanel,
  showThreadsPanel = false,
  setShowThreadsPanel,
  showApprovalsPanel = false,
  setShowApprovalsPanel
}: SystemDrawerProps) {
  const [activeDrawerTab, setActiveDrawerTab] = useState<"environment" | "configurations" | "skills" | "tools">("configurations");
  const [activeConfigSubTab, setActiveConfigSubTab] = useState<"settings" | "memories">("settings");
  const [activeToolsSubTab, setActiveToolsSubTab] = useState<"sandbox" | "termux">("sandbox");

  if (!isOpen) return null;

  return (
    <>
      {/* Dark Overlay with blur */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
        onClick={onClose}
        id="system-drawer-overlay"
      />

      {/* Slideout Container */}
      <div 
        id="system-drawer-container"
        className="fixed right-0 top-0 bottom-0 h-full w-full sm:max-w-2xl md:max-w-3xl bg-[#08080d] border-l border-zinc-800 shadow-2xl z-50 flex flex-col animate-slide-in font-sans"
        style={{
          boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.75)"
        }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-850 bg-zinc-900/60 select-none">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
              <Settings size={18} className="animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <h2 className="text-zinc-100 font-bold font-mono tracking-wide text-xs">SYSTEM UTILITY DRAWER</h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Control pipeline states, settings, skills.md & interactive tools</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-zinc-950/65 text-zinc-400 hover:text-zinc-250 border border-zinc-850 hover:border-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Close utility drawer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Categories Tab Navigation */}
        <div className="grid grid-cols-4 border-b border-zinc-850/60 bg-zinc-950/45 p-1 select-none">
          <button
            onClick={() => setActiveDrawerTab("environment")}
            className={`flex flex-col items-center gap-1 py-3 text-center text-[10px] font-mono tracking-wider font-semibold transition-all border rounded-lg cursor-pointer ${
              activeDrawerTab === "environment" 
                ? "bg-indigo-600/10 border-indigo-500/35 text-indigo-300" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Globe size={15} />
            ENVIRONMENT
          </button>
          
          <button
            onClick={() => setActiveDrawerTab("configurations")}
            className={`flex flex-col items-center gap-1 py-3 text-center text-[10px] font-mono tracking-wider font-semibold transition-all border rounded-lg cursor-pointer ${
              activeDrawerTab === "configurations" 
                ? "bg-pink-600/10 border-pink-500/35 text-pink-300" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Database size={15} />
            CONFIGS & SETTINGS
          </button>

          <button
            onClick={() => setActiveDrawerTab("skills")}
            className={`flex flex-col items-center gap-1 py-3 text-center text-[10px] font-mono tracking-wider font-semibold transition-all border rounded-lg cursor-pointer ${
              activeDrawerTab === "skills" 
                ? "bg-teal-600/10 border-teal-500/35 text-teal-300" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Layers size={15} />
            SKILLS WORKSHOP
          </button>

          <button
            onClick={() => setActiveDrawerTab("tools")}
            className={`flex flex-col items-center gap-1 py-3 text-center text-[10px] font-mono tracking-wider font-semibold transition-all border rounded-lg cursor-pointer ${
              activeDrawerTab === "tools" 
                ? "bg-emerald-600/10 border-emerald-500/35 text-emerald-300" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Cpu size={15} />
            AGENT TOOLS
          </button>
        </div>

        {/* Render area */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0 bg-neutral-[#020205]/10">
          
          {/* Tag 1: ENVIRONMENT */}
          {activeDrawerTab === "environment" && (
            <div className="h-full flex flex-col gap-4">
              <div className="p-3 bg-indigo-950/10 border border-indigo-900/25 rounded-xl flex items-start gap-2.5">
                <Compass className="text-indigo-400 mt-0.5 uppercase" size={15} />
                <div>
                  <h4 className="text-xs font-mono font-bold text-indigo-300">Workspace Environment Status</h4>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                    Review native kernel logs, credentials configuration, outputs & telemetry report pipelines inside the container filesystem.
                  </p>
                </div>
              </div>
              <div className="flex-1 min-h-0 bg-zinc-950/20 rounded-xl">
                <EnvironmentStatus 
                  status={status}
                  reports={reports}
                  apiKeyConfigured={apiKeyConfigured}
                  selectedReport={selectedReport}
                  onRefresh={onRefreshTelemetry}
                  onSelectReport={onSelectReport}
                  onDeleteReport={onDeleteReport}
                  onCreateReportFile={onCreateReportFile}
                />
              </div>
            </div>
          )}

          {/* Tag 2: CONFIGS & SETTINGS */}
          {activeDrawerTab === "configurations" && (
            <div className="h-full flex flex-col gap-4">
              {/* Dual-sub categories */}
              <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 border border-zinc-850/50 rounded-lg shrink-0 select-none">
                <button
                  onClick={() => setActiveConfigSubTab("settings")}
                  className={`flex-1 py-1.5 text-center text-[10px] font-mono font-bold tracking-wide rounded-md transition ${
                    activeConfigSubTab === "settings" 
                      ? "bg-pink-600/10 text-pink-300 border border-pink-900/30 font-semibold" 
                      : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  <Users size={11} className="inline mr-1" />
                  AGENT ARMY & SYSTEM SETTINGS
                </button>
                <button
                  onClick={() => setActiveConfigSubTab("memories")}
                  className={`flex-1 py-1.5 text-center text-[10px] font-mono font-bold tracking-wide rounded-md transition ${
                    activeConfigSubTab === "memories" 
                      ? "bg-pink-600/10 text-pink-300 border border-pink-900/30 font-semibold" 
                      : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  <Database size={11} className="inline mr-1" />
                  COGNITIVE MEMORIES
                </button>
              </div>

              <div className="flex-1 min-h-0">
                {activeConfigSubTab === "settings" ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-full overflow-y-auto flex flex-col gap-5">
                    {/* Workspace Layout controller toggles */}
                    <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col gap-3">
                      <h4 className="text-[10px] font-mono font-bold text-zinc-400 tracking-wider">INTERFACE LAYOUT PREFERENCES</h4>
                      <p className="text-[10.5px] text-zinc-550 leading-normal">
                        Configure auxiliary panels on your dashboard. Collapsing these sideboards focuses 100% of workspace area on the Agent Terminal Console.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
                        <button
                          onClick={() => setShowEnvPanel?.(!showEnvPanel)}
                          className={`px-3 py-2.5 rounded-lg border text-[10.5px] font-mono transition-all flex flex-col items-start gap-1.5 justify-between select-none cursor-pointer ${
                            showEnvPanel 
                              ? "bg-indigo-600/10 border-indigo-500/25 text-indigo-300 shadow-md shadow-indigo-950/20" 
                              : "bg-zinc-900/40 border-zinc-850 text-zinc-500 hover:text-zinc-400 hover:border-zinc-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            <div className={`w-1.5 h-1.5 rounded-full ${showEnvPanel ? "bg-indigo-400 animate-pulse" : "bg-zinc-650"}`} />
                            <span>ENVIRONMENT STATUS</span>
                          </div>
                          <span className="text-[9px] text-zinc-550">{showEnvPanel ? "[VISIBLE]" : "[COLLAPSED]"}</span>
                        </button>

                        <button
                          onClick={() => setShowThreadsPanel?.(!showThreadsPanel)}
                          className={`px-3 py-2.5 rounded-lg border text-[10.5px] font-mono transition-all flex flex-col items-start gap-1.5 justify-between select-none cursor-pointer ${
                            showThreadsPanel 
                              ? "bg-indigo-600/10 border-indigo-500/25 text-indigo-300 shadow-md shadow-indigo-950/20" 
                              : "bg-zinc-900/40 border-zinc-850 text-zinc-500 hover:text-zinc-400 hover:border-zinc-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            <div className={`w-1.5 h-1.5 rounded-full ${showThreadsPanel ? "bg-indigo-400 animate-pulse" : "bg-zinc-650"}`} />
                            <span>ACTIVE THREADS</span>
                          </div>
                          <span className="text-[9px] text-zinc-550">{showThreadsPanel ? "[VISIBLE]" : "[COLLAPSED]"}</span>
                        </button>

                        <button
                          onClick={() => setShowApprovalsPanel?.(!showApprovalsPanel)}
                          className={`px-3 py-2.5 rounded-lg border text-[10.5px] font-mono transition-all flex flex-col items-start gap-1.5 justify-between select-none cursor-pointer ${
                            showApprovalsPanel 
                              ? "bg-indigo-600/10 border-indigo-500/25 text-indigo-300 shadow-md shadow-indigo-950/20" 
                              : "bg-zinc-900/40 border-zinc-850 text-zinc-500 hover:text-zinc-400 hover:border-zinc-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            <div className={`w-1.5 h-1.5 rounded-full ${showApprovalsPanel ? "bg-indigo-400 animate-pulse" : "bg-zinc-650"}`} />
                            <span>APPROVALS QUEUE</span>
                          </div>
                          <span className="text-[9px] text-zinc-550">{showApprovalsPanel ? "[VISIBLE]" : "[COLLAPSED]"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-zinc-850/60 pt-4">
                      <ArmyManager />
                    </div>
                  </div>
                ) : (
                  <MemoryConsole 
                    memories={memories}
                    onCreateMemory={onCreateMemory}
                    onDeleteMemory={onDeleteMemory}
                  />
                )}
              </div>
            </div>
          )}

          {/* Tag 3: SKILLS LIBRARY */}
          {activeDrawerTab === "skills" && (
            <div className="h-full flex flex-col gap-4">
              <div className="p-3 bg-teal-950/10 border border-teal-900/25 rounded-xl flex items-start gap-2.5 shrink-0">
                <Layers className="text-teal-400 mt-0.5" size={15} />
                <div>
                  <h4 className="text-xs font-mono font-bold text-teal-300">Skills Workshop (SKILLS.MD)</h4>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                    View list of injected cognitive skills and configure standard execution metrics. Build custom models with literal files capability parameters.
                  </p>
                </div>
              </div>
              <div className="flex-1 min-h-0 bg-zinc-950/20 rounded-xl">
                <SkillsLibrary 
                  skills={skills}
                  onCreateSkill={onCreateSkill}
                  onDeleteSkill={onDeleteSkill}
                />
              </div>
            </div>
          )}

          {/* Tag 4: AGENT TOOLS */}
          {activeDrawerTab === "tools" && (
            <div className="h-full flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 border border-zinc-850/50 rounded-lg shrink-0 select-none">
                <button
                  onClick={() => setActiveToolsSubTab("sandbox")}
                  className={`flex-1 py-1.5 text-center text-[10px] font-mono font-bold tracking-wide rounded-md transition ${
                    activeToolsSubTab === "sandbox" 
                      ? "bg-emerald-600/10 text-emerald-300 border border-emerald-950/30 font-semibold" 
                      : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  <Cpu size={11} className="inline mr-1" />
                  VM SANDBOX PLAYGROUND
                </button>
                <button
                  onClick={() => setActiveToolsSubTab("termux")}
                  className={`flex-1 py-1.5 text-center text-[10px] font-mono font-bold tracking-wide rounded-md transition ${
                    activeToolsSubTab === "termux" 
                      ? "bg-emerald-600/10 text-emerald-300 border border-emerald-950/30 font-semibold" 
                      : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  <Smartphone size={11} className="inline mr-1" />
                  TERMUX MCP BRIDGE
                </button>
              </div>

              <div className="flex-1 min-h-0 bg-zinc-950/20 rounded-xl">
                {activeToolsSubTab === "sandbox" ? (
                  <SandboxConsole />
                ) : (
                  <McpTermuxBridge />
                )}
              </div>
            </div>
          )}

        </div>

        {/* Drawer Footer Status line */}
        <div className="px-6 py-3 border-t border-zinc-850 bg-zinc-950 flex items-center justify-between text-[10px] text-zinc-500 font-mono select-none shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>LOCAL OVERLAY INTERFACE</span>
          </div>
          <span className="uppercase text-zinc-650">OpenClaw System Bridge v1.1.2</span>
        </div>
      </div>
    </>
  );
}
