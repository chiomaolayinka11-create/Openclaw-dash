import React, { useState } from "react";
import { 
  Database, 
  Plus, 
  Trash2, 
  Tag, 
  ShieldAlert, 
  Brain, 
  Info,
  Calendar
} from "lucide-react";
import { MemoryEntry } from "../types";

interface MemoryConsoleProps {
  memories: MemoryEntry[];
  onCreateMemory: (memory: { content: string; category: string }) => void;
  onDeleteMemory: (id: string) => void;
}

export default function MemoryConsole({
  memories,
  onCreateMemory,
  onDeleteMemory
}: MemoryConsoleProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("user_preference");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onCreateMemory({ content, category });
    setContent("");
  };

  return (
    <div id="memory-console-panel" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Panel title header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Database className="text-pink-400" size={18} />
          <div>
            <h3 className="font-sans font-medium text-zinc-100 text-sm">Cognitive Memory Vault</h3>
            <p className="text-[10px] text-zinc-400 font-mono">Persistent knowledge-graph associations</p>
          </div>
        </div>
        <span className="font-mono text-[9px] bg-pink-950 text-pink-300 px-2 py-0.5 border border-pink-900 rounded-full">
          {memories.length} RECORDS ACTIVE
        </span>
      </div>

      {/* Manual memory insert form */}
      <form onSubmit={handleSubmit} className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg flex flex-col sm:flex-row gap-2 items-center">
        <select
          id="memory-category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full sm:w-auto bg-zinc-900 text-zinc-300 border border-zinc-850 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-pink-500 outline-none cursor-pointer"
        >
          <option value="user_preference">🔧 preference</option>
          <option value="system_state">💻 system environment</option>
          <option value="task_result">📦 execution output</option>
        </select>
        <input
          id="memory-content-input"
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Sync a long-term memory fact to target models, e.g., 'API client uses 16k sampler rate'..."
          className="flex-1 bg-zinc-900 text-zinc-200 border border-zinc-850 rounded px-3 py-1.5 text-xs outline-none focus:border-pink-500"
        />
        <button
          id="save-memory-btn"
          type="submit"
          className="w-full sm:w-auto bg-pink-600 hover:bg-pink-500 text-zinc-100 text-xs font-semibold px-4.5 py-1.5 rounded transition-colors flex items-center gap-1.5 justify-center cursor-pointer select-none"
        >
          <Plus size={13} />
          COMMIT KEY
        </button>
      </form>

      {/* Memory record listings */}
      <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
        {memories.length === 0 ? (
          <div className="text-center p-8 text-zinc-650 bg-zinc-950/20 border border-zinc-900/60 rounded-xl">
            <Brain size={24} className="mx-auto text-zinc-700 animate-pulse mb-1.5" />
            <p className="text-[10px] font-mono">NO MEMORY BLOB RECORDS LOADED</p>
          </div>
        ) : (
          memories.map((entry) => (
            <div 
              id={`memory-card-${entry.id}`}
              key={entry.id}
              className="group border border-zinc-850 hover:border-zinc-800 bg-zinc-950 p-3 rounded-lg flex items-start justify-between gap-3 transition-colors text-xs font-mono"
            >
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    entry.category === 'user_preference' 
                      ? "bg-amber-950/70 border border-amber-900/40 text-amber-300"
                      : entry.category === 'system_state'
                      ? "bg-blue-950/70 border border-blue-900/40 text-blue-300"
                      : "bg-emerald-950/70 border border-emerald-950 text-emerald-300"
                  }`}>
                    {entry.category.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] text-zinc-550 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-zinc-300 leading-relaxed font-mono font-medium text-[11px] sm:text-[11.5px] whitespace-pre-wrap">{entry.content}</p>
              </div>

              <button
                id={`delete-memory-${entry.id}`}
                onClick={() => {
                  if (confirm("Delete this cognitive vector entry?")) {
                    onDeleteMemory(entry.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-zinc-400 hover:text-red-400 rounded transition-all"
                title="Discard memory record"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
