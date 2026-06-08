import React, { useState, useEffect } from "react";
import { 
  Terminal, 
  Layers, 
  Brain, 
  Database, 
  Users, 
  ChevronRight, 
  FileText, 
  X, 
  Eye, 
  Settings, 
  AlertCircle,
  Clock,
  Sparkles,
  RotateCw,
  FolderOpen,
  MessageSquare,
  Plus,
  Trash2,
  Save,
  Cpu,
  Download,
  Smartphone,
  Share
} from "lucide-react";
import EnvironmentStatus from "./components/EnvironmentStatus";
import ConsolePanel from "./components/ConsolePanel";
import SkillsLibrary from "./components/SkillsLibrary";
import MemoryConsole from "./components/MemoryConsole";
import ApprovalsQueue from "./components/ApprovalsQueue";
import ArmyManager from "./components/ArmyManager";
import SandboxConsole from "./components/SandboxConsole";
import McpTermuxBridge from "./components/McpTermuxBridge";
import SystemDrawer from "./components/SystemDrawer";
import { SystemStatus, AgentSkill, MemoryEntry, AgentStep, ApprovalRequest, ConversationThread } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"console" | "memory" | "skills" | "army" | "sandbox" | "mcp">("console");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  
  // PWA Install Prompt Event states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
      console.log("PWA: Mobile beforeinstallprompt event captured.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Initial check if display mode is already standalone icon
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false);
    }

    // iOS Safari manual instruction banner trigger
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && ((window.navigator as any).standalone);
    if (ios && !isInStandaloneMode) {
      setIsIOS(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: Mobile install trigger response status: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };
  
  // App States
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [reports, setReports] = useState<Array<{ name: string; size: number; updatedAt: string; contentSample: string }>>([]);
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("thread-default");
  
  // Collapsible Panel layout configurations
  const [showEnvPanel, setShowEnvPanel] = useState<boolean>(false);
  const [showThreadsPanel, setShowThreadsPanel] = useState<boolean>(false);
  const [showApprovalsPanel, setShowApprovalsPanel] = useState<boolean>(false);
  
  // Active Agent state
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [activeSkillId, setActiveSkillId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(false);

  // File previewer state
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [viewingReportModal, setViewingReportModal] = useState<boolean>(false);
  const [isSavingReport, setIsSavingReport] = useState<boolean>(false);
  const [saveStatusText, setSaveStatusText] = useState<string>("");

  // Initial Sync
  useEffect(() => {
    syncAllTelemetry();
  }, []);

  const syncAllTelemetry = async () => {
    try {
      const [statusRes, skillsRes, memoriesRes, approvalsRes, reportsRes, threadsRes] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/skills"),
        fetch("/api/memories"),
        fetch("/api/approvals"),
        fetch("/api/reports"),
        fetch("/api/threads")
      ]);

      const statusData = await statusRes.json();
      const skillsData = await skillsRes.json();
      const memoriesData = await memoriesRes.json();
      const approvalsData = await approvalsRes.json();
      const reportsData = await reportsRes.json();
      const threadsData = await threadsRes.json();

      setStatus(statusData);
      setSkills(skillsData);
      setMemories(memoriesData);
      setApprovals(approvalsData);
      setReports(reportsData);
      setThreads(threadsData);

      // Check if API Key is configured via response headers or endpoint payload
      setApiKeyConfigured(statusData.llmModel !== "simulated");

      // Set active thread details onto console viewport
      const currentTh = threadsData.find((t: any) => t.id === activeThreadId) || threadsData[0];
      if (currentTh) {
        setSteps(currentTh.steps || []);
        setAnswer(currentTh.answer || "");
      }
    } catch (e) {
      console.error("Telemetry sync failed:", e);
    }
  };

  const handleToggleAutoMode = async () => {
    try {
      const res = await fetch("/api/status/toggle-mode", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStatus((prev) => prev ? { ...prev, autoMode: data.autoMode } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSkill = async (newSkill: any) => {
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSkill)
      });
      if (res.ok) {
        const data = await res.json();
        setSkills((prev) => [...prev, data]);
        // Trigger alert memory insert
        handleCreateMemory({
          content: `Created new customized execution skill: ${newSkill.name}. Guardrails synced.`,
          category: "system_state"
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSkills((prev) => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMemory = async (newMemory: { content: string; category: string }) => {
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemory)
      });
      if (res.ok) {
        const data = await res.json();
        setMemories((prev) => [...prev, data]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemories((prev) => prev.filter(m => m.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDecideApproval = async (id: string, statusDecision: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/approvals/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusDecision })
      });
      if (res.ok) {
        const data = await res.json();
        setApprovals((prev) => prev.map(a => a.id === id ? data.approval : a));
        // Refresh sidebar outputs in case writing report committed
        const reportsRes = await fetch("/api/reports");
        const reportsData = await reportsRes.json();
        setReports(reportsData);
        // Refresh status metrics count
        fetch("/api/status").then(r => r.json()).then(setStatus);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBatchDecideApproval = async (ids: string[], statusDecision: 'approved' | 'rejected') => {
    try {
      const res = await fetch("/api/approvals/batch-decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: statusDecision })
      });
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals);
        // Refresh sidebar outputs in case writing report committed
        const reportsRes = await fetch("/api/reports");
        const reportsData = await reportsRes.json();
        setReports(reportsData);
        // Refresh status metrics count
        fetch("/api/status").then(r => r.json()).then(setStatus);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunAgentTask = async (prompt: string) => {
    setLoading(true);
    setAnswer("");
    setSteps([]);
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          activeSkillId,
          autoMode: status?.autoMode || false,
          threadId: activeThreadId
        })
      });

      if (!res.ok) {
        throw new Error("Failed to process agent inferences.");
      }

      const data = await res.json();
      setSteps(data.steps || []);
      setAnswer(data.answer || "");
      
      // Update reports checklist, threads, approvals, metrics
      const [repData, apprData, statData, ThData] = await Promise.all([
        fetch("/api/reports").then(r => r.json()),
        fetch("/api/approvals").then(r => r.json()),
        fetch("/api/status").then(r => r.json()),
        fetch("/api/threads").then(r => r.json())
      ]);

      setReports(repData);
      setApprovals(apprData);
      setStatus(statData);
      setThreads(ThData);
    } catch (e: any) {
      setAnswer(`⚠️ Error triggering LLM pipeline in host: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create real thread context
  const handleCreateThread = async () => {
    const title = prompt("Enter Research Topic context title:");
    if (!title) return;
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        const newTh = await res.json();
        setThreads((prev) => [...prev, newTh]);
        setActiveThreadId(newTh.id);
        setSteps(newTh.steps || []);
        setAnswer(newTh.answer || "");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete real thread context
  const handleDeleteThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length <= 1) {
      alert("At least one active research thread context is required on system stack.");
      return;
    }
    try {
      const res = await fetch(`/api/threads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setThreads((prev) => prev.filter(t => t.id !== id));
        if (activeThreadId === id) {
          const remaining = threads.filter(t => t.id !== id);
          setActiveThreadId(remaining[0].id);
          setSteps(remaining[0].steps || []);
          setAnswer(remaining[0].answer || "");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    const th = threads.find(t => t.id === id);
    if (th) {
      setSteps(th.steps || []);
      setAnswer(th.answer || "");
    }
  };

  const handleSelectReport = async (name: string) => {
    setSelectedReport(name);
    setSaveStatusText("");
    try {
      const res = await fetch(`/api/reports/${name}`);
      if (res.ok) {
        const data = await res.json();
        setReportContent(data.content);
        setViewingReportModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save modified markdown or code artifacts
  const handleSaveReportModifications = async () => {
    if (!selectedReport || reportContent === null) return;
    setIsSavingReport(true);
    setSaveStatusText("Saving modifications directly to disk memory...");
    try {
      const res = await fetch("/api/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedReport, content: reportContent })
      });
      if (res.ok) {
        setSaveStatusText("⚡ SUCCESS: Committed to output folder!");
        // Refresh items
        const listRes = await fetch("/api/reports");
        const listData = await listRes.json();
        setReports(listData);
        setTimeout(() => setSaveStatusText(""), 3500);
      } else {
        const err = await res.json();
        setSaveStatusText(`❌ FAILURE: ${err.error}`);
      }
    } catch (e: any) {
      setSaveStatusText(`❌ ERROR: ${e.message}`);
    } finally {
      setIsSavingReport(false);
    }
  };

  // Create report blank file
  const handleCreateReportFile = async (name: string) => {
    try {
      const res = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const listRes = await fetch("/api/reports");
        const listData = await listRes.json();
        setReports(listData);
        // Alert logger to memory sync
        handleCreateMemory({
          content: `Spawned file artifact: '${name}' manually. Ready for direct IDE edit.`,
          category: "task_result"
        });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to initialize artifact file.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReportFile = async (name: string) => {
    try {
      const res = await fetch(`/api/reports/${name}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter(r => r.name !== name));
        if (selectedReport === name) {
          setSelectedReport(null);
          setReportContent(null);
          setViewingReportModal(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Compute responsive layout spans dynamically depending on collapsible states
  let consoleColSpanClass = "xl:col-span-5";
  if (showThreadsPanel && showApprovalsPanel) {
    consoleColSpanClass = "xl:col-span-5";
  } else if (showThreadsPanel && !showApprovalsPanel) {
    consoleColSpanClass = "xl:col-span-9";
  } else if (!showThreadsPanel && showApprovalsPanel) {
    consoleColSpanClass = "xl:col-span-8";
  } else {
    consoleColSpanClass = "xl:col-span-12";
  }

  return (
    <div id="openclaw-dashboard-viewport" className="min-h-screen bg-[#040407] text-zinc-100 font-sans flex flex-col tracking-wide antialiased cyber-lattice relative">
      
      {/* Top Navigation banner header */}
      <header className="bg-zinc-900/60 border-b border-zinc-805 px-6 py-4.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        
        {/* Brand visual identity logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 border border-indigo-500/25 rounded-xl text-indigo-400 font-mono font-bold text-center tracking-tighter text-sm flex items-center justify-center relative shadow-inner">
            <Layers className="animate-spin text-indigo-400" size={20} style={{ animationDuration: '9s' }} />
          </div>
          <div>
            <span className="font-mono text-[9px] bg-indigo-950 border border-indigo-900/50 text-indigo-300 px-2.5 py-0.5 rounded-full uppercase tracking-widest font-semibold block w-max leading-none mb-1 shadow-sm">
              v1.4 Distributed Orchestration
            </span>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-zinc-100 text-lg tracking-tight select-text">OpenClaw AI Dashboard</h1>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono font-semibold bg-emerald-950/40 px-2 py-0.5 border border-emerald-900/30 rounded-md">
                ● LIVE SECURE
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic header stats counts */}
        <div className="flex items-center gap-5 font-mono text-xs text-zinc-400">
          <div className="text-right hidden md:block">
            <span className="text-[10px] text-zinc-500 block leading-none mb-0.5">ACTIVE COGNITIVE AGENT:</span>
            <span className="text-zinc-300 font-semibold text-xs flex items-center gap-1.5 justify-end">
              <Sparkles size={11} className="text-indigo-400 animate-pulse" /> OpenClaw Prime
            </span>
          </div>

          <button 
            id="global-sync-btn"
            onClick={syncAllTelemetry}
            className="flex items-center gap-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-3.5 py-2 rounded-lg border border-zinc-750 transition-colors text-xs font-semibold select-none cursor-pointer"
          >
            <RotateCw size={12} />
            SYNC TELEMETRY
          </button>

          <button 
            id="open-drawer-header-btn"
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-550 text-zinc-100 px-3.5 py-2 rounded-lg border border-indigo-505/30 transition-all text-xs font-bold select-none cursor-pointer shadow-md shadow-indigo-950/25 shrink-0"
          >
            <Settings size={12} className="animate-spin text-zinc-200" style={{ animationDuration: '10s' }} />
            OPEN SYSTEM DRAWER
          </button>
        </div>
      </header>

      {/* Dynamic PWA Install Banner */}
      {showInstallPrompt && (
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-5 lg:px-6 mt-4">
          <div className="bg-gradient-to-r from-indigo-950 via-zinc-900 to-indigo-950 border border-indigo-500/25 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-indigo-950/10 animate-pulse" style={{ animationDuration: '4s' }}>
            <div className="flex items-center gap-3.5 text-center md:text-left flex-col md:flex-row">
              <div className="p-3 bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 rounded-xl relative shrink-0">
                <Smartphone className="animate-bounce" size={22} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-zinc-100 text-sm tracking-wide">
                  Install OpenClaw Native Mobile Dashboard
                </h3>
                <p className="text-xs text-zinc-400 font-sans mt-0.5 max-w-xl">
                  Run OpenClaw as a full-screen, low-latency utility on your smartphone. Keeps compilation pipelines, diagnostic terminals, and cognitive sandboxes right at your fingertips with absolute zero distraction.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 shrink-0 select-none">
              <button
                onClick={handleInstallApp}
                className="bg-indigo-605 hover:bg-indigo-500 text-zinc-100 border border-indigo-500/25 px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 cursor-pointer"
              >
                <Download size={13} />
                INSTALL ON PHONE
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="bg-transparent hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-zinc-850 hover:border-zinc-800 px-3 py-2 rounded-xl text-xs font-mono transition cursor-pointer"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Instructions banner */}
      {isIOS && (
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-5 lg:px-6 mt-4">
          <div className="bg-gradient-to-r from-indigo-950 via-zinc-900 to-indigo-950 border border-indigo-500/25 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-indigo-950/10">
            <div className="flex items-center gap-3.5 text-center md:text-left flex-col md:flex-row">
              <div className="p-3 bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 rounded-xl relative shrink-0">
                <Smartphone size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-zinc-100 text-sm tracking-wide">
                  Add OpenClaw to your iPhone & iPad
                </h3>
                <p className="text-xs text-zinc-400 font-sans mt-0.5 max-w-xl">
                  iOS Safari allows installing this platform: Tap Safari's <span className="text-zinc-200 font-semibold">Share button</span> (square with arrow up icon <Share size={11} className="inline mr-0.5 text-indigo-400" /> on toolbar), scroll, and choose <span className="text-zinc-200 font-semibold">'Add to Home Screen'</span>.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsIOS(false)}
              className="bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-850 px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-zinc-200 transition cursor-pointer shrink-0"
            >
              GOT IT, THANKS
            </button>
          </div>
        </div>
      )}

      {/* Primary Dashboard Grid Split - Confined to Agent Console terminal and command line */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        
        {/* Left column: Optional Environment status metrics & log file browser */}
        {showEnvPanel && (
          <div className="lg:col-span-4 h-full transition-all duration-300">
            <EnvironmentStatus 
              status={status}
              reports={reports}
              apiKeyConfigured={apiKeyConfigured}
              selectedReport={selectedReport}
              onRefresh={syncAllTelemetry}
              onSelectReport={handleSelectReport}
              onDeleteReport={handleDeleteReportFile}
              onCreateReportFile={handleCreateReportFile}
            />
          </div>
        )}

        {/* Right column: Conversational dashboard block */}
        <div className={`${showEnvPanel ? "lg:col-span-8" : "lg:col-span-12"} flex flex-col gap-5 min-h-0 transition-all duration-300`}>
          
          {/* Dynamic tabs render content container */}
          <div className="flex-1 min-h-0">
            {activeTab === "console" && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-full min-h-0 transition-all duration-300">
                
                {/* Active threads list sub-sidebar (3 columns) */}
                {showThreadsPanel && (
                  <div className="xl:col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 h-full overflow-y-auto select-none shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between border-b border-zinc-805 pb-2.5">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 tracking-wider">ACTIVE THREADS</span>
                      <button
                        onClick={handleCreateThread}
                        className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 rounded transition-colors cursor-pointer"
                        title="New Conversation Thread"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      {threads.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => handleSelectThread(thread.id)}
                          className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border text-xs ${
                            activeThreadId === thread.id
                              ? "bg-indigo-600/10 border-indigo-500/35 text-indigo-300 font-semibold"
                              : "bg-zinc-950/60 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <MessageSquare size={12} className={activeThreadId === thread.id ? "text-indigo-400" : "text-zinc-550"} />
                            <span className="truncate w-[100px] leading-tight font-mono text-[11px]">{thread.title}</span>
                          </div>
                          {threads.length > 1 && (
                            <button
                              onClick={(e) => handleDeleteThread(thread.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-900 text-zinc-550 hover:text-red-400 rounded transition duration-150"
                              title="Delete thread"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversational console center screen (dynamic columns) */}
                <div className={`${consoleColSpanClass} h-full min-h-0 transition-all duration-300`}>
                  <ConsolePanel 
                    skills={skills}
                    activeSkillId={activeSkillId}
                    onSkillChange={setActiveSkillId}
                    autoMode={status?.autoMode || false}
                    onToggleAutoMode={handleToggleAutoMode}
                    onRunAgent={handleRunAgentTask}
                    steps={steps}
                    answer={answer}
                    loading={loading}
                  />
                </div>

                {/* Safety approvals queue right panel (4 columns) */}
                {showApprovalsPanel && (
                  <div className="xl:col-span-4 h-full min-h-0 overflow-y-auto transition-all duration-300">
                    <ApprovalsQueue 
                      approvals={approvals}
                      onDecide={handleDecideApproval}
                      onBatchDecide={handleBatchDecideApproval}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "memory" && (
              <MemoryConsole 
                memories={memories}
                onCreateMemory={handleCreateMemory}
                onDeleteMemory={handleDeleteMemory}
              />
            )}

            {activeTab === "skills" && (
              <SkillsLibrary 
                skills={skills}
                onCreateSkill={handleCreateSkill}
                onDeleteSkill={handleDeleteSkill}
              />
            )}

            {activeTab === "army" && (
              <ArmyManager />
            )}

            {activeTab === "sandbox" && (
              <SandboxConsole />
            )}

            {activeTab === "mcp" && (
              <McpTermuxBridge />
            )}
          </div>
        </div>
      </main>

      {/* Slide-out System Drawer containing configs, settings, environment, skills & tools */}
      <SystemDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        status={status}
        reports={reports}
        apiKeyConfigured={apiKeyConfigured}
        selectedReport={selectedReport}
        onRefreshTelemetry={syncAllTelemetry}
        onSelectReport={handleSelectReport}
        onDeleteReport={handleDeleteReportFile}
        onCreateReportFile={handleCreateReportFile}
        memories={memories}
        onCreateMemory={handleCreateMemory}
        onDeleteMemory={handleDeleteMemory}
        skills={skills}
        onCreateSkill={handleCreateSkill}
        onDeleteSkill={handleDeleteSkill}
        showEnvPanel={showEnvPanel}
        setShowEnvPanel={setShowEnvPanel}
        showThreadsPanel={showThreadsPanel}
        setShowThreadsPanel={setShowThreadsPanel}
        showApprovalsPanel={showApprovalsPanel}
        setShowApprovalsPanel={setShowApprovalsPanel}
      />

      {/* Document Report Interactive IDE modal overlay */}
      {viewingReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 md:p-10 select-none">
          <div 
            id="report-viewer-modal"
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col p-6 shadow-2xl relative"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-zinc-805 pb-4">
              <div className="flex items-center gap-3">
                <FolderOpen className="text-indigo-400" size={20} />
                <div>
                  <span className="font-mono text-[9px] bg-indigo-950 border border-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded uppercase font-semibold">
                    Workspace Sandbox IDE
                  </span>
                  <h3 className="font-sans font-bold text-zinc-100 text-sm tracking-wide select-text mt-0.5">{selectedReport}</h3>
                </div>
              </div>
              <button
                id="close-report-viewer-btn"
                onClick={() => setViewingReportModal(false)}
                className="text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-750 border border-zinc-750 rounded-lg p-2.5 transition cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Document contents (now editable IDE textarea) */}
            <div className="flex-1 flex flex-col gap-2 my-4">
              <span className="font-mono text-[9px] text-zinc-550 font-bold uppercase select-none">Active Sandbox Artifact Source Code:</span>
              <div className="flex-1 border border-zinc-850 rounded-xl overflow-hidden font-mono text-xs bg-zinc-950 p-3">
                <textarea
                  value={reportContent !== null ? reportContent : ""}
                  onChange={(e) => setReportContent(e.target.value)}
                  disabled={reportContent === null || isSavingReport}
                  className="w-full h-full bg-transparent text-zinc-200 resize-none outline-none leading-relaxed custom-scrollbar custom-textarea border-0 font-mono"
                  style={{ fontFamily: '"JetBrains Mono", Courier, monospace' }}
                  spellCheck="false"
                />
              </div>
              {saveStatusText && (
                <div className={`text-[10px] font-mono font-bold py-1.5 px-3 rounded ${
                  saveStatusText.includes("SUCCESS") 
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/35"
                    : "bg-indigo-950/20 text-indigo-400"
                }`}>
                  {saveStatusText}
                </div>
              )}
            </div>

            {/* Footer action buttons */}
            <div className="flex items-center justify-between border-t border-zinc-855 pt-3">
              <span className="text-[10px] font-sans text-zinc-500 font-medium">Auto-syncs straight back to local directories inside cloud nodes.</span>
              <div className="flex items-center gap-2">
                <button
                  id="save-report-edits-btn"
                  onClick={handleSaveReportModifications}
                  disabled={isSavingReport || reportContent === null}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-zinc-100 px-4.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border border-indigo-500/25 select-none transition"
                >
                  <Save size={13} />
                  COMMIT CHANGES
                </button>
                <button
                  id="footer-close-report-btn"
                  onClick={() => setViewingReportModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold px-4.5 py-2 rounded-lg transition-colors cursor-pointer select-none border border-zinc-750"
                >
                  Close Editor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Humbler tiny footer line */}
      <footer className="bg-zinc-950 border-t border-zinc-900/60 py-3.5 px-6 text-center text-[10px] font-mono text-zinc-650 tracking-wider select-none mt-auto">
        OPENCLAW DISTRIBUTED HYBRID KERNEL // MODEL PIPELINE CONNECTS ACTIVE INTEL COGNITIVE CHANNELS
      </footer>
    </div>
  );
}
