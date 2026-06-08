import React from "react";
import { 
  Server, 
  Cpu, 
  Database, 
  Terminal, 
  Slack, 
  Radio, 
  CheckCircle, 
  XCircle, 
  Key, 
  FileText, 
  Trash2, 
  RefreshCw, 
  ExternalLink 
} from "lucide-react";
import { SystemStatus } from "../types";

interface EnvironmentStatusProps {
  status: SystemStatus | null;
  reports: Array<{ name: string; size: number; updatedAt: string; contentSample: string }> | [];
  apiKeyConfigured: boolean;
  selectedReport: string | null;
  onRefresh: () => void;
  onSelectReport: (name: string) => void;
  onDeleteReport: (name: string) => void;
  onCreateReportFile?: (name: string) => void;
}

export default function EnvironmentStatus({
  status,
  reports,
  apiKeyConfigured,
  selectedReport,
  onRefresh,
  onSelectReport,
  onDeleteReport,
  onCreateReportFile
}: EnvironmentStatusProps) {
  const [newFileName, setNewFileName] = React.useState("");
  const [showCreateInput, setShowCreateInput] = React.useState(false);
  
  if (!status) {
    return (
      <div id="loading-status" className="p-6 text-center text-zinc-400 font-mono text-xs">
        <RefreshCw className="animate-spin inline-block mr-2 text-indigo-400" size={16} />
        Synchronizing system telemetry...
      </div>
    );
  }

  const memoryPercent = Math.round((status.metrics.memory.used / status.metrics.memory.total) * 100);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    let finalName = newFileName.trim();
    if (!finalName.includes(".")) finalName += ".md";
    if (onCreateReportFile) {
      onCreateReportFile(finalName);
    }
    setNewFileName("");
    setShowCreateInput(false);
  };

  return (
    <div id="env-status-panel" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-6 select-none shadow-xl">
      {/* Header telemetry info */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Server className="text-zinc-300" size={18} />
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-900 rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-medium text-zinc-200 text-sm tracking-wide">OpenClaw Core</h3>
            <p className="font-mono text-[10px] text-emerald-400">STATUS: ACTIVE // DECK-1</p>
          </div>
        </div>
        <button 
          id="refresh-telemetry-btn"
          onClick={onRefresh}
          className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded-md transition-colors"
          title="Refresh Telemetry"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* API Credentials checklist */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] text-zinc-500 tracking-wider font-semibold uppercase">API Authenticator</span>
        <div className="bg-zinc-950/60 border border-zinc-850 rounded-lg p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-zinc-400 flex items-center gap-1.5">
              <Key size={13} className="text-indigo-400" />
              Gemini LLM Channel
            </span>
            {apiKeyConfigured ? (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle size={12} /> ONLINE
              </span>
            ) : (
              <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1">
                <XCircle size={12} /> SECRETS KEY PENDING
              </span>
            )}
          </div>
          <p className="text-[10px] leading-relaxed text-zinc-500 font-sans">
            {apiKeyConfigured 
              ? "Live Gemini 3.5 Flash modeling enabled with Search Grounding tools." 
              : "No key found on start. Host is fallback simulating local execution nodes gracefully."
            }
          </p>
        </div>
      </div>

      {/* Dynamic Gauges (CPU / MEMORY) */}
      <div className="flex flex-col gap-4">
        <span className="font-mono text-[10px] text-zinc-500 tracking-wider font-semibold uppercase">Local Machine Resources</span>
        
        {/* CPU */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-zinc-400 flex items-center gap-1">
              <Cpu size={12} className="text-teal-400" /> CPU Allocation
            </span>
            <span className="text-teal-400 font-medium">{status.metrics.cpu}%</span>
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${status.metrics.cpu}%` }} 
            />
          </div>
        </div>

        {/* Memory */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-zinc-400 flex items-center gap-1">
              <Database size={12} className="text-pink-400" /> Disk RAM Mem
            </span>
            <span className="text-pink-400 font-medium">{status.metrics.memory.used}MB / {status.metrics.memory.total}MB</span>
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-pink-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${memoryPercent}%` }} 
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-zinc-950/40 border border-zinc-850 p-2 rounded-lg text-center">
            <div className="text-[10px] font-mono text-zinc-500">TOKENS TODAY</div>
            <div className="text-xs font-mono font-bold text-zinc-300 mt-0.5">{status.metrics.tokensToday}</div>
          </div>
          <div className="bg-zinc-950/40 border border-zinc-850 p-2 rounded-lg text-center">
            <div className="text-[10px] font-mono text-zinc-500">TOTAL SECURE STEPS</div>
            <div className="text-xs font-mono font-bold text-zinc-300 mt-0.5">{status.metrics.stepsExecuted}</div>
          </div>
        </div>
      </div>

      {/* Connected Interfaces */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] text-zinc-500 tracking-wider font-semibold uppercase">Platform Webhooks Connectors</span>
        <div className="grid grid-cols-2 gap-2">
          {/* CLI */}
          <div className="flex items-center gap-2 bg-zinc-950/50 border border-zinc-850 p-2 rounded-lg">
            <Terminal size={12} className={status.connectedPlatforms.cli ? "text-emerald-400" : "text-zinc-600"} />
            <div className="flex flex-col">
              <span className="text-[10px] font-sans font-medium text-zinc-300">Terminal CLI</span>
              <span className="text-[8px] font-mono text-emerald-400">CONNECTED</span>
            </div>
          </div>
          {/* Slack */}
          <div className="flex items-center gap-2 bg-zinc-950/50 border border-zinc-850 p-2 rounded-lg">
            <Slack size={12} className={status.connectedPlatforms.slack ? "text-emerald-400" : "text-zinc-600"} />
            <div className="flex flex-col">
              <span className="text-[10px] font-sans font-medium text-zinc-300">Slack Webhook</span>
              <span className="text-[8px] font-mono text-emerald-400">ACTIVE</span>
            </div>
          </div>
          {/* Telegram */}
          <div className="flex items-center gap-2 bg-zinc-950/50 border border-zinc-850 p-2 rounded-lg">
            <Radio size={12} className={status.connectedPlatforms.telegram ? "text-emerald-400" : "text-zinc-600"} />
            <div className="flex flex-col">
              <span className="text-[10px] font-sans font-medium text-zinc-300">Telegram Bot</span>
              <span className={`text-[8px] font-mono ${status.connectedPlatforms.telegram ? "text-emerald-400" : "text-zinc-500"}`}>
                {status.connectedPlatforms.telegram ? "BOUND" : "OFFLINE"}
              </span>
            </div>
          </div>
          {/* WhatsApp */}
          <div className="flex items-center gap-2 bg-zinc-950/50 border border-zinc-850 p-2 rounded-lg">
            <ExternalLink size={12} className={status.connectedPlatforms.webhook ? "text-emerald-400" : "text-zinc-600"} />
            <div className="flex flex-col">
              <span className="text-[10px] font-sans font-medium text-zinc-300">HTTP REST Gateway</span>
              <span className="text-[8px] font-mono text-emerald-400">HTTP:3000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Output Files (The Artifact Folder Memory) */}
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        <span className="font-mono text-[10px] text-zinc-500 tracking-wider font-semibold uppercase">Workspace Sandbox Outputs</span>
        <div className="bg-zinc-950/70 border border-zinc-850 rounded-lg p-2.5 flex-1 min-h-[160px] overflow-y-auto flex flex-col gap-1.5 custom-scrollbar">
          {reports.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <FileText className="text-zinc-700 mb-1.5" size={24} />
              <p className="text-[10px] font-mono text-zinc-500">WORKSPACE EMPTY</p>
              <p className="text-[9px] text-zinc-600 leading-normal mt-0.5">Use the agent console to write research or documentation papers.</p>
            </div>
          ) : (
            reports.map((report) => (
              <div 
                id={`report-item-${report.name}`}
                key={report.name}
                onClick={() => onSelectReport(report.name)}
                className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-all border ${
                  selectedReport === report.name 
                    ? "bg-zinc-800/80 border-indigo-500/50" 
                    : "bg-zinc-950 hover:bg-zinc-900 border-zinc-900 hover:border-zinc-850"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={selectedReport === report.name ? "text-indigo-400" : "text-zinc-500"} size={14} />
                  <div className="min-w-0">
                    <div className="text-[11px] font-sans font-medium text-zinc-300 truncate w-[130px]">{report.name}</div>
                    <div className="text-[8px] font-mono text-zinc-500 flex gap-2">
                      <span>{Math.round(report.size / 100) / 10} KB</span>
                      <span>•</span>
                      <span>{new Date(report.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <button
                  id={`delete-report-${report.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm(`Are you sure you want to delete '${report.name}'?`)) {
                      onDeleteReport(report.name);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 rounded transition-all"
                  title="Delete artifact"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Action button to show/hide inline form */}
        <div className="mt-1">
          {showCreateInput ? (
            <form onSubmit={handleCreateSubmit} className="flex gap-1.5 items-center bg-zinc-950 p-1.5 border border-zinc-800 rounded-lg">
              <input
                type="text"
                placeholder="filename.md ..."
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="flex-1 bg-transparent text-xs font-mono text-zinc-200 outline-none px-2 py-1 placeholder-zinc-500 border border-zinc-850 focus:border-indigo-500 rounded"
                autoFocus
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-mono text-white px-2.5 py-1 rounded font-bold cursor-pointer transition-colors"
              >
                CREATE
              </button>
              <button
                type="button"
                onClick={() => setShowCreateInput(false)}
                className="text-zinc-400 hover:text-zinc-200 text-[10px] font-mono px-1.5"
              >
                ESC
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateInput(true)}
              className="w-full bg-zinc-950/40 text-left hover:bg-zinc-900 border border-zinc-850 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              + ADD NEW FILE ARTIFACT
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
