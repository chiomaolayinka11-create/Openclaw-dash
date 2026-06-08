import React, { useState, useEffect } from "react";
import { Terminal, PlayCircle, Loader2, RefreshCw, Cpu, Flame, ScrollText } from "lucide-react";
import { SystemLog } from "../types";

export default function SandboxConsole() {
  const [unbounded, setUnbounded] = useState<boolean>(false);
  const [code, setCode] = useState<string>(
`// Sandboxed JS VM host execution environment
// Write algorithmic sequences & model computations below

const calculateMetrics = (sessions, baseTokens) => {
  console.log("Starting statistical projection loop...");
  let totalInferences = 0;
  let simulatedLoads = [];

  for (let i = 1; i <= sessions; i++) {
    const burst = Math.floor(Math.random() * 85) + 15;
    totalInferences += burst;
    simulatedLoads.push({ session: i, tokens: burst * baseTokens });
  }

  console.log("Inferences processed:", totalInferences);
  return { totalInferences, simulatedLoads };
};

console.log("Evaluating OpenClaw cognitive simulation...");
const metrics = calculateMetrics(6, 120);

// The last evaluated statement returns back onto the deck console
\`Compilation OK! Total calculated tokens: \${metrics.simulatedLoads.reduce((a, b) => a + b.tokens, 0)} across \${metrics.totalInferences} inferences.\`;`
  );

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>("VM console telemetry standing by...");
  const [evalResult, setEvalResult] = useState<string>("undefined");
  const [execSuccess, setExecSuccess] = useState<boolean | null>(null);

  // System logs state
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isPollingLogs, setIsPollingLogs] = useState(true);

  // Fetch log lines
  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {
      // quiet fallback
    }
  };

  // Poll system logs periodically
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      if (isPollingLogs) {
        fetchLogs();
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [isPollingLogs]);

  // Execute sandboxed or unbounded code
  const handleExecute = async () => {
    setIsRunning(true);
    setExecSuccess(null);
    try {
      const res = await fetch("/api/sandbox/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, unbounded })
      });
      const data = await res.json();
      if (data.success) {
        setOutput(data.output || "No stdout logs printed.");
        setEvalResult(data.result || "undefined");
        setExecSuccess(true);
      } else {
        setOutput(data.output || "");
        setEvalResult(`CompileError: ${data.error}`);
        setExecSuccess(false);
      }
    } catch (err: any) {
      setOutput(`Communication Failure: ${err.message}`);
      setExecSuccess(false);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div id="sandbox-workspace-card" className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full min-h-0">
      
      {/* Node Interactive VM Compiler Panel */}
      <div className="md:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-805 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="text-indigo-400" size={18} />
            <div>
              <h3 className="font-sans font-medium text-zinc-100 text-sm">NodeJSVM Sandbox Compiler</h3>
              <p className="text-[10px] text-zinc-400 font-mono">Isolated V8 instance stack limits</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 select-none">
            {/* Unbounded executor toggle switch */}
            <button
              onClick={() => {
                const nextMode = !unbounded;
                setUnbounded(nextMode);
                if (nextMode) {
                  setCode(`// Unbounded System Execution activated (Outside Sandbox Core)
// Direct access to native modules (fs, child_process, os, etc.) is fully available.

const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

console.log("Memory total:", Math.round(os.totalmem() / (1024 * 1024)) + " MB");
console.log("Operating system platform:", os.platform() + " (" + os.arch() + ")");

try {
  // Read local app files directly outside sandbox context
  const files = fs.readdirSync('.');
  console.log("Local root workspace directory includes files:", files.filter(f => !f.startsWith('.')));
} catch (e) {
  console.log("Folder inspection failed:", e.message);
}

"Task executed successfully outside the sandbox!";`);
                } else {
                  setCode(`// Sandboxed JS VM host execution environment
// Write algorithmic sequences & model computations below

const calculateMetrics = (sessions, baseTokens) => {
  console.log("Starting statistical projection loop...");
  let totalInferences = 0;
  let simulatedLoads = [];

  for (let i = 1; i <= sessions; i++) {
    const burst = Math.floor(Math.random() * 85) + 15;
    totalInferences += burst;
    simulatedLoads.push({ session: i, tokens: burst * baseTokens });
  }

  console.log("Inferences processed:", totalInferences);
  return { totalInferences, simulatedLoads };
};

console.log("Evaluating OpenClaw cognitive simulation...");
const metrics = calculateMetrics(6, 120);

// The last statement is returned
\`Compilation OK! Total calculated tokens: \${metrics.simulatedLoads.reduce((a, b) => a + b.tokens, 0)}\`;`);
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                unbounded 
                  ? "bg-red-950/45 text-red-400 border-red-500/40 animate-pulse" 
                  : "bg-zinc-950 text-zinc-500 border-zinc-850 hover:bg-zinc-900"
              }`}
              title="Toggle execution outside or inside standard VM bounds"
            >
              {unbounded ? "🔴 SYSTEM EXECUTIVE (UNBOUNDED)" : "🔒 SANDBOX CONSTRAINED"}
            </button>

            <button
              onClick={handleExecute}
              disabled={isRunning}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-zinc-100 disabled:text-zinc-500 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-indigo-500/30 transition-colors"
            >
              {isRunning ? (
                <>
                  <Loader2 className="animate-spin text-zinc-100" size={13} />
                  COMPILING...
                </>
              ) : (
                <>
                  <PlayCircle size={13} />
                  RUN CODE
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Input Field */}
        <div className="flex-1 min-h-[220px] flex flex-col border border-zinc-850 rounded-xl overflow-hidden font-mono text-xs bg-zinc-950 p-2.5 relative">
          <span className="absolute top-2 right-3 text-[8px] font-semibold text-zinc-650 bg-zinc-900/60 px-1.5 border border-zinc-800/40 rounded uppercase font-mono tracking-widest select-none">
            Main.ts
          </span>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full flex-1 bg-transparent text-zinc-200 resize-none outline-none leading-relaxed custom-scrollbar custom-textarea"
            style={{ fontFamily: '"JetBrains Mono", Courier, monospace' }}
            spellCheck="false"
          />
        </div>

        {/* Console outputs area */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[9px] text-zinc-500 tracking-wider uppercase font-semibold">VM STD_OUT OUTPUT logs:</span>
          <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 h-[130px] overflow-y-auto font-mono text-xs text-zinc-300 custom-scrollbar whitespace-pre-wrap leading-relaxed select-text">
            {output}
          </div>
        </div>

        {/* Evaluated Return Values Area */}
        <div className="bg-zinc-950/60 border border-zinc-850 rounded-lg px-3 py-2.5 flex items-center justify-between">
          <span className="font-mono text-[9px] text-zinc-500 font-bold uppercase select-none">Evaluated VM Return:</span>
          <span className={`font-mono text-xs font-semibold ${
            execSuccess === true 
              ? "text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30" 
              : execSuccess === false
              ? "text-red-400 bg-red-950/25 px-2 py-0.5 rounded border border-red-900/20"
              : "text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded"
          }`}>
            {evalResult}
          </span>
        </div>
      </div>

      {/* Streaming Event logs panel */}
      <div className="md:col-span-5 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-805 pb-3">
          <div className="flex items-center gap-2">
            <ScrollText className="text-zinc-300 animate-pulse" size={18} />
            <div>
              <h3 className="font-sans font-medium text-zinc-100 text-sm">Real-Time Core Stream Logs</h3>
              <p className="text-[10px] text-zinc-400 font-mono">Continuous kernel actions pipeline</p>
            </div>
          </div>
          <button
            onClick={() => setIsPollingLogs(!isPollingLogs)}
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono transition-colors font-semibold flex items-center gap-1 cursor-pointer ${
              isPollingLogs 
                ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/40" 
                : "bg-zinc-800 text-zinc-400 border-zinc-750"
            }`}
          >
            <RefreshCw size={10} className={isPollingLogs ? "animate-spin" : ""} />
            {isPollingLogs ? "STREAMING" : "PAUSED"}
          </button>
        </div>

        {/* Scrollable Event Logs Window */}
        <div className="flex-1 bg-zinc-950/80 border border-zinc-850 rounded-xl p-3.5 flex flex-col gap-2 overflow-y-auto custom-scrollbar uppercase font-mono max-h-[460px] select-text">
          {logs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-650 italic text-[10px] py-16">
              Awaiting active orchestration signals...
            </div>
          ) : (
            [...logs].reverse().map((log, index) => {
              let levelColor = "text-indigo-400 bg-indigo-950/35 border-indigo-900/40";
              if (log.level === 'warn') {
                levelColor = "text-red-400 bg-red-950/25 border-red-950";
              } else if (log.level === 'success') {
                levelColor = "text-emerald-400 bg-emerald-950/30 border-emerald-900/40";
              } else if (log.level === 'dev') {
                levelColor = "text-teal-400 bg-teal-950/30 border-teal-900/40";
              }

              return (
                <div key={index} className="flex flex-col gap-1 border-b border-zinc-900/40 pb-2 text-[10px] last:border-0 lowercase select-text">
                  <div className="flex justify-between items-center text-[8.5px]">
                    <span className={`uppercase font-bold px-1.5 py-0.5 rounded border ${levelColor}`}>
                      {log.level}
                    </span>
                    <span className="text-zinc-600 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-zinc-300 font-mono pl-1 leading-normal select-text">{log.message}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
