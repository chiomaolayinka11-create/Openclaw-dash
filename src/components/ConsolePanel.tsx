import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Terminal, 
  ShieldAlert, 
  Zap, 
  Settings, 
  CircleDot, 
  Brain, 
  Compass, 
  ExternalLink,
  Lock,
  Unlock,
  AlertOctagon,
  RefreshCw
} from "lucide-react";
import { AgentStep, AgentSkill } from "../types";

interface ConsolePanelProps {
  skills: AgentSkill[];
  activeSkillId: string;
  onSkillChange: (id: string) => void;
  autoMode: boolean;
  onToggleAutoMode: () => void;
  onRunAgent: (prompt: string) => Promise<void>;
  steps: AgentStep[];
  answer: string;
  loading: boolean;
}

export default function ConsolePanel({
  skills,
  activeSkillId,
  onSkillChange,
  autoMode,
  onToggleAutoMode,
  onRunAgent,
  steps,
  answer,
  loading
}: ConsolePanelProps) {
  const [promptInput, setPromptInput] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [steps, loading, answer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || loading) return;
    const currentPrompt = promptInput;
    setPromptInput("");
    onRunAgent(currentPrompt);
  };

  const currentSkill = skills.find((key) => key.id === activeSkillId);

  return (
    <div id="agent-console-panel" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col h-full shadow-2xl relative">
      {/* Console Top Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-805 pb-4 gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="text-indigo-400 animate-pulse" size={18} />
          <div>
            <h2 className="font-sans font-medium text-zinc-100 text-sm tracking-wide">Live Agent Terminal</h2>
            <p className="text-[10px] text-zinc-400 font-mono">CHANNEL: OpenClaw-Prime-01</p>
          </div>
        </div>
        
        {/* Toggle auto mode (Executor safety deck) */}
        <div className="flex items-center gap-2.5 bg-zinc-950 p-1.5 rounded-lg border border-zinc-850">
          <button
            id="toggle-safe-mode-btn"
            onClick={onToggleAutoMode}
            className={`flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded transition-all ${
              !autoMode 
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="Require authorization queue for destructive calculations"
          >
            <Lock size={11} className={!autoMode ? "text-indigo-300" : "text-zinc-500"} />
            EXEC APPROVAL SAFE
          </button>
          
          <button
            id="toggle-yolo-mode-btn"
            onClick={onToggleAutoMode}
            className={`flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded transition-all ${
              autoMode 
                ? "bg-amber-600/20 text-amber-300 border border-amber-500/30" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="Execute file modifications and system activities autonomously"
          >
            <Unlock size={11} className={autoMode ? "text-amber-300" : "text-zinc-500"} />
            YOLO AUTO AUTO
          </button>
        </div>
      </div>

      {/* Skill routing selector */}
      <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-2 flex items-center justify-between gap-4 text-xs font-mono select-none">
        <span className="text-zinc-550 text-[10px] tracking-wider font-semibold uppercase">Focus Skill Profile:</span>
        <select
          id="skill-profile-select"
          value={activeSkillId}
          onChange={(e) => onSkillChange(e.target.value)}
          className="bg-zinc-900 text-zinc-300 border border-zinc-800 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer max-w-[200px]"
        >
          <option value="">-- Direct Direct Orchestration --</option>
          {skills.filter(s => s.enabled).map((skill) => (
            <option key={skill.id} value={skill.id}>{skill.name}</option>
          ))}
        </select>
      </div>

      {/* Dynamic Agent Progress Timeline */}
      {(steps.length > 0 || loading) && (() => {
        const firstThought = steps.find(s => s.type === "thought");
        const firstTool = steps.find(s => s.type === "tool_call" || s.type === "tool_output");
        const firstApproval = steps.find(s => s.type === "approval_required");

        const intakeState = steps.length > 0 || loading ? "completed" : "idle";
        
        let analysisState: "idle" | "active" | "completed" = "idle";
        if (firstThought) {
          analysisState = "completed";
        } else if (loading && steps.length > 0) {
          analysisState = "active";
        }

        let executionState: "idle" | "active" | "completed" = "idle";
        if (firstTool) {
          executionState = "completed";
        } else if (loading && firstThought) {
          executionState = "active";
        }

        let governingState: "idle" | "active" | "completed" = "idle";
        if (firstApproval) {
          governingState = answer ? "completed" : "active";
        } else if (loading && firstTool) {
          governingState = "idle";
        }

        let consensusState: "idle" | "active" | "completed" = "idle";
        if (answer) {
          consensusState = "completed";
        } else if (loading && (firstTool || firstThought) && !firstApproval) {
          consensusState = "active";
        }

        const scrollToElement = (id: string) => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-indigo-500", "scale-[1.01]");
            setTimeout(() => {
              el.classList.remove("ring-2", "ring-indigo-500", "scale-[1.01]");
            }, 2000);
          }
        };

        const timelineStages = [
          {
            label: "Intake",
            subtitle: "Prompt Parsed",
            state: intakeState,
            icon: Send,
            targetId: steps[0] ? `step-card-${steps[0].id}` : null
          },
          {
            label: "Analysis",
            subtitle: "Planning Thoughts",
            state: analysisState,
            icon: Brain,
            targetId: firstThought ? `step-card-${firstThought.id}` : null
          },
          {
            label: "Execution",
            subtitle: "Running Action Tools",
            state: executionState,
            icon: Zap,
            targetId: firstTool ? `step-card-${firstTool.id}` : null
          },
          {
            label: "Governing",
            subtitle: "Safety Checks",
            state: governingState,
            icon: ShieldAlert,
            targetId: firstApproval ? `step-card-${firstApproval.id}` : null
          },
          {
            label: "Consensus",
            subtitle: "Synthesizing Output",
            state: consensusState,
            icon: Compass,
            targetId: answer ? "final-conversational-response" : null
          }
        ];

        return (
          <div className="bg-zinc-950/80 border-b border-zinc-850/60 p-4 select-none">
            <div className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Dynamic Reasoning Pipeline Timeline</span>
              <span className="text-indigo-400 font-semibold animate-pulse">
                {loading ? "PROBING PIPELINE STATE..." : "TRACE INTERMEDIATE STEPS"}
              </span>
            </div>
            
            <div className="relative flex items-center justify-between mt-1">
              {/* Horizontal line background */}
              <div className="absolute left-6 right-6 top-[18px] h-[1.5px] bg-zinc-850 -z-0" />
              <div 
                className="absolute left-6 top-[18px] h-[1.5px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-all duration-700 -z-0" 
                style={{
                  width: `${
                    consensusState === "completed" ? "100" :
                    governingState === "completed" || governingState === "active" ? "75" :
                    executionState === "completed" || executionState === "active" ? "50" :
                    analysisState === "completed" || analysisState === "active" ? "25" : "0"
                  }%`
                }}
              />

              {/* Individual Stage nodes */}
              {timelineStages.map((stage, idx) => {
                const isCompleted = stage.state === "completed";
                const isActive = stage.state === "active";
                const Icon = stage.icon;

                return (
                  <div 
                    key={idx}
                    onClick={() => stage.targetId && scrollToElement(stage.targetId)}
                    className={`flex flex-col items-center flex-1 relative z-10 ${stage.targetId ? "cursor-pointer group" : "cursor-default opacity-50"}`}
                  >
                    <div 
                      className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center border transition-all duration-300 relative ${
                        isCompleted 
                          ? "bg-indigo-950/45 border-indigo-500/80 text-indigo-400 group-hover:bg-indigo-900/30 group-hover:scale-110 shadow-md shadow-indigo-950/50" 
                          : isActive 
                          ? "bg-zinc-900 border-indigo-400 text-indigo-300 animate-pulse ring-2 ring-indigo-500/10 shadow-lg shadow-indigo-950/70" 
                          : "bg-zinc-950 border-zinc-850 text-zinc-650"
                      }`}
                      title={stage.subtitle}
                    >
                      <Icon size={14} className={isActive ? "animate-bounce" : ""} />
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping" />
                      )}
                    </div>
                    
                    <span className={`text-[9.5px] font-sans font-bold uppercase mt-2 tracking-wide transition-colors ${
                      isCompleted ? "text-zinc-300 font-semibold" :
                      isActive ? "text-indigo-400 font-extrabold text-glow-indigo" : "text-zinc-600"
                    }`}>
                      {stage.label}
                    </span>
                    <span className="text-[8px] font-mono mt-0.5 text-zinc-550 opacity-80 uppercase hidden sm:inline text-center">
                      {stage.subtitle.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Active terminal steps and answer stream viewport */}
      <div className="flex-1 overflow-y-auto px-1 py-4 flex flex-col gap-4 custom-scrollbar min-h-[250px]">
        {steps.length === 0 && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Brain className="text-zinc-800 animate-bounce mb-2" size={32} />
            <span className="font-mono text-[10px] text-zinc-500 tracking-widest font-semibold uppercase">System Stanby Matrix</span>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed font-sans">
              Enter a task prompt. You can command OpenClaw to perform live Google web search grounding, generate report files on disk, or analyze system status.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-md">
              <button 
                id="preprompt-search-button"
                onClick={() => setPromptInput("Search the live web for the latest artificial intelligence agent innovations in 2026")}
                className="text-[10px] bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 p-2 rounded-lg transition-all"
              >
                🔎 Live AI agent trends in 2026
              </button>
              <button 
                id="preprompt-write-button"
                onClick={() => setPromptInput("Write an extensive architectural report about agentic system safety protocols named safety_manual.md")}
                className="text-[10px] bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 p-2 rounded-lg transition-all"
              >
                📝 Write report file safety_manual.md
              </button>
            </div>
          </div>
        )}

        {/* Display agent steps log trace */}
        {steps.map((step, idx) => (
          <div 
            id={`step-card-${step.id}`}
            key={step.id || idx} 
            className={`border rounded-lg p-3.5 transition-all text-xs font-mono select-text ${
              step.type === "thought" 
                ? "bg-zinc-950/40 border-zinc-850/80 text-zinc-300"
                : step.type === "tool_call"
                ? "bg-indigo-950/20 border-indigo-500/20 text-indigo-300"
                : step.type === "tool_output"
                ? "bg-teal-950/20 border-teal-500/20 text-teal-300"
                : step.type === "approval_required"
                ? "bg-amber-950/35 border-amber-500/40 text-amber-300"
                : "bg-zinc-800/25 border-zinc-800 text-zinc-100"
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-850/40 font-semibold text-[10px] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <CircleDot size={10} className={
                  step.type === "thought" ? "text-zinc-500 animate-pulse" :
                  step.type === "tool_call" ? "text-indigo-400" :
                  step.type === "tool_output" ? "text-teal-400" :
                  step.type === "approval_required" ? "text-amber-500" : "text-zinc-400"
                } />
                {step.title}
              </span>
              <span className="text-[9px] text-zinc-500">
                {new Date(step.timestamp).toLocaleTimeString([], { hour12: false })}
              </span>
            </div>

            <p className="leading-relaxed font-mono text-[11px] font-medium pre-wrap break-all">{step.message}</p>

            {/* Display web search grounding references */}
            {step.metadata?.searchLinks && (
              <div className="mt-2.5 flex flex-wrap gap-2 border-t border-zinc-900 pt-2 text-[9px] font-sans">
                <span className="text-zinc-500 font-mono font-bold">Anchors:</span>
                {step.metadata.searchLinks.map((link: any, i: number) => (
                  <a 
                    key={i} 
                    href={link.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/40 text-indigo-200 px-2 py-0.5 rounded flex items-center gap-1"
                  >
                    {link.title} <ExternalLink size={8} />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Display live agent conversation outputs */}
        {answer && (
          <div id="final-conversational-response" className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl mt-2 select-text shadow-inner">
            <span className="font-mono text-[9px] text-zinc-500 tracking-wider font-semibold uppercase flex items-center gap-1.5 border-b border-zinc-900 pb-2 mb-3">
              <Compass size={11} className="text-emerald-400" />
              Final Output Answer Consensus
            </span>
            <div className="text-[12.5px] font-sans leading-relaxed text-zinc-200 whitespace-pre-wrap">
              {answer}
            </div>
          </div>
        )}

        {/* Loading activity line */}
        {loading && (
          <div id="terminal-loading-prompt" className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg text-xs font-mono text-zinc-500 flex items-center gap-2.5 select-none py-4">
            <RefreshCw className="animate-spin text-indigo-400" size={15} />
            <span>OpenClaw processing dynamic model inferences under live orchestration pipeline...</span>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Primary chat prompt submission console */}
      <form onSubmit={handleSubmit} className="border-t border-zinc-850 pt-4 flex gap-2.5 items-center select-none">
        <input
          id="prompt-input-field"
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder={loading ? "Agent is busy running thoughts..." : "Instruct the target agent, e.g., 'Do a web search on the solar system'..."}
          disabled={loading}
          className="flex-1 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-lg px-4 py-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-zinc-600 disabled:opacity-50"
        />
        <button
          id="submit-prompt-btn"
          type="submit"
          disabled={loading || !promptInput.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-zinc-100 disabled:text-zinc-600 px-4 py-3 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer disabled:cursor-not-allowed h-full"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
