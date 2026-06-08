import React, { useState } from "react";
import { 
  Puzzle, 
  Plus, 
  Trash2, 
  Settings, 
  Check, 
  Info,
  Code,
  Shield,
  Layers,
  X
} from "lucide-react";
import { AgentSkill } from "../types";

interface SkillsLibraryProps {
  skills: AgentSkill[];
  onCreateSkill: (skill: { name: string; description: string; systemPrompt: string; codeSnippet: string; category: 'system' | 'custom' | 'browser' | 'database' }) => void;
  onDeleteSkill: (id: string) => void;
}

export default function SkillsLibrary({
  skills,
  onCreateSkill,
  onDeleteSkill
}: SkillsLibraryProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [category, setCategory] = useState<'system' | 'custom' | 'browser' | 'database'>("custom");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;
    onCreateSkill({ name, description, systemPrompt, codeSnippet, category });
    
    // reset form
    setName("");
    setDescription("");
    setSystemPrompt("");
    setCodeSnippet("");
    setCategory("custom");
    setShowAddForm(false);
  };

  return (
    <div id="skills-library-panel" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header section with Add Button */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Puzzle className="text-teal-400" size={18} />
          <div>
            <h3 className="font-sans font-medium text-zinc-100 text-sm">Skills Workshop</h3>
            <p className="text-[10px] text-zinc-400 font-mono">Agent intelligence plug-ins</p>
          </div>
        </div>
        <button
          id="show-add-skill-form-btn"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-zinc-100 text-[10px] font-semibold px-2.5 py-1.5 rounded transition-all cursor-pointer select-none"
        >
          <Plus size={11} />
          CREATE SKILL
        </button>
      </div>

      {/* Embedded modal-style form overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-lg shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
              <span className="font-mono text-xs text-teal-400 flex items-center gap-1.5 font-bold uppercase">
                <Layers size={13} />
                Forge Custom Skill Plugin
              </span>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="text-zinc-500 hover:text-zinc-300 rounded p-1 hover:bg-zinc-800 transition"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400">Skill Name *</label>
                <input 
                  id="new-skill-name-input"
                  type="text" 
                  required
                  placeholder="e.g. RSS News Summarizer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 p-2 text-zinc-200 rounded outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400">Description</label>
                <input 
                  id="new-skill-description-input"
                  type="text" 
                  placeholder="Summarize trends from technology newsletters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 p-2 text-zinc-200 rounded outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400">Execution Category</label>
                <select 
                  id="new-skill-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-800 p-2 text-zinc-200 rounded outline-none cursor-pointer focus:border-teal-500"
                >
                  <option value="custom">Custom (Behavioral)</option>
                  <option value="browser">Browser-Use Automation</option>
                  <option value="database">Memory Database Queries</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 flex items-center gap-1.5">
                  System Guardrail Prompt *
                  <span className="text-[9px] text-zinc-500 font-sans tracking-wide lowercase italic">Guides agent response layout</span>
                </label>
                <textarea 
                  id="new-skill-prompt-textarea"
                  required
                  rows={4}
                  placeholder="e.g. You are an expert curator. Read tech sources and structure a weekly summary list in Markdown formats."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 p-2 text-zinc-200 rounded outline-none font-mono text-[11px] focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 flex items-center gap-1">
                  Custom JavaScript Evaluator
                  <span className="text-[9px] text-zinc-500 tracking-wide lowercase italic font-sans">Optional evaluation sandbox script</span>
                </label>
                <textarea 
                  id="new-skill-code-textarea"
                  rows={3}
                  placeholder="e.g. function runCustomLogic(data) { return data.filter(e => e.score > 80); }"
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 p-2 text-zinc-200 rounded outline-none font-mono text-[11px] focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex gap-2.5 justify-end border-t border-zinc-850 pt-3.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 px-3.5 py-1.5 rounded transition"
                >
                  Cancel
                </button>
                <button
                  id="submit-skill-btn"
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-zinc-100 px-4 py-1.5 rounded transition"
                >
                  Compile Forge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid listing skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {skills.map((skill) => (
          <div 
            id={`skill-card-${skill.id}`}
            key={skill.id}
            className="group relative bg-zinc-950 border border-zinc-850 rounded-xl p-4 flex flex-col gap-2.5 transition-all hover:border-zinc-800"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className={`p-1 rounded ${
                  skill.category === 'system' ? "bg-zinc-900 border border-zinc-850 text-indigo-400" : "bg-zinc-900 border border-zinc-850 text-teal-400"
                }`}>
                  {skill.category === 'system' ? <Shield size={12} /> : <Code size={12} />}
                </span>
                <span className="font-sans font-semibold text-zinc-200 text-xs tracking-wide">{skill.name}</span>
              </div>
              <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded tracking-widest ${
                skill.category === 'system' 
                  ? "bg-indigo-950 border border-indigo-900/40 text-indigo-300" 
                  : "bg-teal-950 border border-teal-900/40 text-teal-300"
              }`}>
                {skill.category}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-zinc-400 font-sans">{skill.description}</p>
            
            <div className="bg-zinc-900/50 rounded-lg p-2 flex gap-2 text-[9px] font-mono border border-zinc-900">
              <span className="text-zinc-500 font-bold">PROMPT:</span>
              <span className="text-zinc-400 truncate max-w-[220px]">{skill.systemPrompt}</span>
            </div>

            {skill.category !== 'system' && (
              <button
                id={`delete-skill-${skill.id}`}
                onClick={() => {
                  if (confirm(`Do you want to delete the custom skill '${skill.name}'?`)) {
                    onDeleteSkill(skill.id);
                  }
                }}
                className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-850 rounded transition-all"
                title="Delete Skill"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
