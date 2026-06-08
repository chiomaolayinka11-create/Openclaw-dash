import React, { useState, useEffect } from "react";
import { 
  Users, 
  CircleDot, 
  Cpu, 
  PlayCircle,
  Loader2,
  Terminal,
  Activity,
  Heart,
  ScrollText
} from "lucide-react";

interface SubAgent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idling' | 'offline';
  cpu: number;
  memory: string;
  activeTask: string;
  machineId: string;
}

const PRESET_DIAGNOSTICS: Record<string, string> = {
  "agent-1": `// Coordinator-Prime Orchestrator Diagnostic check
console.log("Initializing cognitive orchestration queues... OK");
const microservices = ["SearchClaw", "DevClaw", "SecurityClaw"];
const latencies = microservices.map(srv => ({
  node: srv,
  ms: Math.floor(Math.random() * 15) + 3
}));
console.log("Cluster responses latencies:", latencies);
"HEALTH OPTIMAL: Maximum cluster node latency is " + Math.max(...latencies.map(l => l.ms)) + "ms";`,

  "agent-2": `// SearchClaw Grounding Verification
console.log("Pinging Search Grounding fallback indices...");
const activeCacheKeys = 482;
console.log("DNS verification: search-grounding.google.api... SUCCESS");
\`Grounding resolution completed. Active vectors matched: \${activeCacheKeys} tokens.\`;`,

  "agent-3": `// DevClaw V8 Compiler stack scanner
console.log("Scanning sandboxed host VM memory indexes...");
const memInfo = process.memoryUsage();
console.log("Current memory footprint parameters: HeapUsed=" + Math.round(memInfo.heapUsed / 1024 / 1024) + "MB");
\`Compilation verification clean. Code injector stack index: 0x\${(memInfo.heapUsed).toString(16).toUpperCase()}\`;`,

  "agent-4": `// SecurityClaw approval ledger scanner
console.log("Analyzing file path write authorization permissions...");
const strictRules = ["reports/", "threads.json", "skills.json"];
console.log("Scanned path schemas: ", strictRules);
"CRYPTOGRAPHIC SIGNATURE VALID. Security layer guarding write transactions.";`,

  "agent-5": `// AutoWrite document parser validation
console.log("Simulating template formatting buffer output streams...");
const mdDoc = "# Operational Report\\nTimestamp: " + new Date().toISOString();
console.log("MD File Stream previewer length written: " + mdDoc.length);
"Write-pipeline buffers sanitized. Output disk modules ready.";`,

  "agent-6": `// WebScraper connection verify
console.log("Testing gateway proxy address pools...");
console.warn("Connection timeout. Scraper state is offline (Hibernated).");
"Warning: Node hibernated. Please toggle active-automation modes first.";`
};

export default function ArmyManager() {
  const [agents, setAgents] = useState<SubAgent[]>([
    {
      id: "agent-1",
      name: "Coordinator-Prime",
      role: "Central Orchestrator",
      status: "active",
      cpu: 12,
      memory: "112MB",
      activeTask: "Reviewing central prompt queue buffers...",
      machineId: "NODE-A1"
    },
    {
      id: "agent-2",
      name: "SearchClaw",
      role: "Web Grounding Specialist",
      status: "idling",
      cpu: 0,
      memory: "64MB",
      activeTask: "Standby for search index calls...",
      machineId: "NODE-A1"
    },
    {
      id: "agent-3",
      name: "DevClaw",
      role: "Sandbox Code Execution",
      status: "idling",
      cpu: 0,
      memory: "88MB",
      activeTask: "Listening on Javascript calculation hook...",
      machineId: "NODE-B1"
    },
    {
      id: "agent-4",
      name: "SecurityClaw",
      role: "Executive Approval Guard",
      status: "active",
      cpu: 4,
      memory: "48MB",
      activeTask: "Auditing write workspace transactions...",
      machineId: "NODE-B2"
    },
    {
      id: "agent-5",
      name: "AutoWrite-3000",
      role: "Document Formatter Component",
      status: "idling",
      cpu: 0,
      memory: "32MB",
      activeTask: "Standby for file write operations...",
      machineId: "NODE-A1"
    },
    {
      id: "agent-6",
      name: "WebScraper-Z",
      role: "Raw Site Crawler",
      status: "offline",
      cpu: 0,
      memory: "0MB",
      activeTask: "Hibernated. Awaiting focus trigger.",
      machineId: "NODE-B1"
    }
  ]);

  const [selectedAgentId, setSelectedAgentId] = useState<string>("agent-1");
  const [probeCode, setProbeCode] = useState<string>(PRESET_DIAGNOSTICS["agent-1"]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [probeOutput, setProbeOutput] = useState<string>("Click 'TRIGGER ACTIVE DIAGNOSTIC' below to execute the live script against DevClaw Node...");
  const [probeReturn, setProbeReturn] = useState<string>("undefined");
  const [probeSuccess, setProbeSuccess] = useState<boolean | null>(null);

  // Minor fluctuations to make the dashboard feel alive
  useEffect(() => {
    const timer = setInterval(() => {
      setAgents((prev) => {
        return prev.map((agent) => {
          if (agent.status === "offline") return agent;
          
          let newStatus = agent.status;
          let newTask = agent.activeTask;
          let newCpu = agent.cpu;

          if (Math.random() > 0.85 && agent.id !== "agent-1" && agent.id !== "agent-4") {
            newStatus = agent.status === "active" ? "idling" : "active";
            if (newStatus === "active") {
              if (agent.id === "agent-2") newTask = "Validating SSL domains and grounding vectors...";
              if (agent.id === "agent-3") newTask = "Spinning VM sandbox memory stack...";
              if (agent.id === "agent-5") newTask = "Formatting analytical tables...";
              newCpu = Math.floor(Math.random() * 25) + 5;
            } else {
              if (agent.id === "agent-2") newTask = "Standby for search index calls...";
              if (agent.id === "agent-3") newTask = "Listening on Javascript calculation hook...";
              if (agent.id === "agent-5") newTask = "Standby for file write operations...";
              newCpu = 0;
            }
          } else if (agent.status === "active") {
            newCpu = Math.max(3, Math.min(95, agent.cpu + (Math.floor(Math.random() * 7) - 3)));
          }

          return {
            ...agent,
            status: newStatus,
            cpu: newCpu,
            activeTask: newTask
          };
        });
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleSelectAgent = (agent: SubAgent) => {
    setSelectedAgentId(agent.id);
    setProbeCode(PRESET_DIAGNOSTICS[agent.id] || `console.log("No custom probe loaded for: ${agent.name}");`);
    setProbeOutput(`Diagnostic probe script loaded for microservice node '${agent.name}'. Ready.`);
    setProbeReturn("undefined");
    setProbeSuccess(null);
  };

  const handleRunDiagnosticProbe = async () => {
    setIsExecuting(true);
    setProbeSuccess(null);
    try {
      const activeAgent = agents.find(a => a.id === selectedAgentId);
      
      const res = await fetch("/api/sandbox/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: probeCode })
      });
      const data = await res.json();
      if (data.success) {
        setProbeOutput(data.output || "No stdout console messages captured.");
        setProbeReturn(data.result || "undefined");
        setProbeSuccess(true);

        // Inject custom system log event on backend for total realism!
        await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `🔧 Dynamic diagnostic executed successfully on ${activeAgent?.name || "Target Node"} cluster.`,
            category: "system_state"
          })
        });
      } else {
        setProbeOutput(data.output || "");
        setProbeReturn(`DiagnosticProbeError: ${data.error}`);
        setProbeSuccess(false);
      }
    } catch (err: any) {
      setProbeOutput(`IO error attempting connection to node memory: ${err.message}`);
      setProbeSuccess(false);
    } finally {
      setIsExecuting(false);
    }
  };

  const totalActive = agents.filter(a => a.status === "active").length;
  const totalOffline = agents.filter(a => a.status === "offline").length;
  const currentSelectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  return (
    <div id="army-manager-panel" className="flex flex-col gap-5 h-full min-h-0">
      
      {/* Top cluster nodes grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-805 pb-3">
          <div className="flex items-center gap-2">
            <Users className="text-emerald-400" size={18} />
            <div>
              <h3 className="font-sans font-medium text-zinc-100 text-sm">Cluster Microservice Army</h3>
              <p className="text-[10px] text-zinc-400 font-mono">Distributed cluster status monitor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 font-mono text-[9px] select-none">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              {totalActive} ACTIVE
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400">{agents.length - totalActive - totalOffline} STANDBY</span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-500">{totalOffline} OFFLINE</span>
          </div>
        </div>

        {/* 6 Grid Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((agent) => (
            <div 
              id={`army-agent-card-${agent.id}`}
              key={agent.id}
              onClick={() => handleSelectAgent(agent)}
              className={`bg-zinc-950 border rounded-xl p-4 flex flex-col gap-3 transition-all cursor-pointer relative select-none ${
                selectedAgentId === agent.id 
                  ? "border-indigo-500 ring-1 ring-indigo-500/10 shadow-lg shadow-indigo-500-[0.05]" 
                  : "border-zinc-900 hover:border-zinc-800"
              }`}
            >
              {/* Row 1: Profile info */}
              <div className="flex items-start justify-between gap-2 border-b border-zinc-904 pb-2">
                <div>
                  <h4 className="font-sans font-bold text-zinc-200 text-xs tracking-wide">{agent.name}</h4>
                  <p className="text-[9px] text-zinc-500 font-mono">{agent.role}</p>
                </div>
                <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                  agent.status === "active" 
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" 
                    : agent.status === "idling"
                    ? "bg-zinc-900 text-zinc-400 border border-zinc-850"
                    : "bg-red-950/20 text-red-500 border border-red-950"
                }`}>
                  {agent.status}
                </span>
              </div>

              {/* Row 2: Metrics */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono leading-none">
                <div className="bg-zinc-900/40 border border-zinc-850 p-1.5 rounded text-center">
                  <span className="text-zinc-550 block text-[7.5px] font-semibold uppercase mb-1">CPU</span>
                  <span className="text-zinc-300 font-bold">{agent.cpu}%</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-850 p-1.5 rounded text-center">
                  <span className="text-zinc-550 block text-[7.5px] font-semibold uppercase mb-1">RAM</span>
                  <span className="text-zinc-300 font-bold">{agent.memory}</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-850 p-1.5 rounded text-center">
                  <span className="text-zinc-550 block text-[7.5px] font-semibold uppercase mb-1">HOST</span>
                  <span className="text-zinc-300 font-bold">{agent.machineId}</span>
                </div>
              </div>

              {/* Row 3: Active task status text */}
              <div className="bg-zinc-950 rounded-lg p-2 flex gap-1.5 items-start border border-zinc-900/50">
                <CircleDot size={10} className={`mt-0.5 ${agent.status === 'active' ? 'text-indigo-400 animate-pulse' : 'text-zinc-650'}`} />
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase block tracking-wider leading-none mb-0.5">STATE:</span>
                  <p className="text-[10px] text-zinc-400 leading-tight truncate">{agent.activeTask}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced dynamic remote VM probe panel collapsible container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row gap-5">
        
        {/* Diagnostic Code scripting (Editable) */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex items-center justify-between border-b border-zinc-805 pb-2">
            <div className="flex items-center gap-2 font-sans">
              <Terminal className="text-indigo-400" size={16} />
              <div className="leading-tight">
                <h4 className="text-zinc-200 text-xs font-semibold">Active Node Diagnostic Script Editor</h4>
                <p className="text-[9px] text-zinc-500 font-mono">Debugging target: <span className="text-zinc-300 font-bold font-mono">{currentSelectedAgent.name}</span></p>
              </div>
            </div>
            
            <button
              onClick={handleRunDiagnosticProbe}
              disabled={isExecuting || currentSelectedAgent.status === 'offline'}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-zinc-100 disabled:text-zinc-500 px-3 py-1.5 rounded border border-indigo-500/20 text-[10px] font-mono font-bold cursor-pointer transition-colors"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="animate-spin" size={10} />
                  PROBING NODE...
                </>
              ) : (
                <>
                  <Activity size={10} />
                  TRIGGER DIALOGS PROBE
                </>
              )}
            </button>
          </div>

          {/* Diagnostic Code text blocks */}
          <div className="h-[180px] border border-zinc-850 rounded-lg p-2.5 bg-zinc-950 font-mono text-xs relative flex flex-col">
            <span className="absolute top-2 right-2.5 text-[8.5px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-1 font-semibold rounded select-none uppercase">
              probe.js
            </span>
            <textarea
              value={probeCode}
              onChange={(e) => setProbeCode(e.target.value)}
              disabled={isExecuting}
              className="w-full flex-1 bg-transparent text-zinc-200 resize-none outline-none leading-relaxed custom-scrollbar custom-textarea"
              style={{ fontFamily: '"JetBrains Mono", Courier, monospace' }}
              spellCheck="false"
            />
          </div>
        </div>

        {/* Live execution response monitors */}
        <div className="w-full md:w-[320px] flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-zinc-805 pb-2">
            <ScrollText className="text-zinc-400" size={15} />
            <span className="text-zinc-200 text-xs font-semibold">Probe Telemetry Responses</span>
          </div>

          {/* Console standard outputs */}
          <div className="flex-1 min-h-[110px] md:min-h-0 bg-zinc-950 border border-zinc-850 p-3 rounded-lg font-mono text-[10.5px] text-zinc-300 overflow-y-auto leading-relaxed custom-scrollbar whitespace-pre-wrap select-text">
            {probeOutput}
          </div>

          {/* Core result evaluated response */}
          <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 flex items-center justify-between text-[10px] font-mono leading-none">
            <span className="text-zinc-500 font-bold uppercase select-none flex items-center gap-1">
              <Heart className={`text-zinc-650 ${probeSuccess ? "text-emerald-400 animate-pulse" : ""}`} size={11} /> Return code:
            </span>
            <span className={`font-semibold shrink-0 max-w-[170px] truncate ${
              probeSuccess === true
                ? "text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/20"
                : probeSuccess === false
                ? "text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded border border-red-900/10"
                : "text-zinc-500"
            }`}>
              {probeReturn}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
