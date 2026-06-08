import React, { useState } from "react";
import { 
  ShieldAlert, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  FileCode, 
  Clock, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Square,
  CheckSquare
} from "lucide-react";
import { ApprovalRequest } from "../types";

interface ApprovalsQueueProps {
  approvals: ApprovalRequest[];
  onDecide: (id: string, decision: 'approved' | 'rejected') => void;
  onBatchDecide?: (ids: string[], decision: 'approved' | 'rejected') => void;
}

export default function ApprovalsQueue({
  approvals,
  onDecide,
  onBatchDecide
}: ApprovalsQueueProps) {
  const [expandedPayloadId, setExpandedPayloadId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const pendingCount = approvals.filter(a => a.status === "pending").length;
  const pendingApprovals = approvals.filter(a => a.status === "pending");
  const pendingIds = pendingApprovals.map(a => a.id);
  
  // Filter selected list based on elements currently pending and existing
  const currentSelectedIds = selectedIds.filter(id => pendingIds.includes(id));
  const isAllSelected = pendingIds.length > 0 && currentSelectedIds.length === pendingIds.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  return (
    <div id="approvals-queue-panel" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Title block with counters */}
      <div className="flex flex-col gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-amber-500 animate-pulse" size={18} />
            <div>
              <h3 className="font-sans font-medium text-zinc-100 text-sm">Approvals Queue</h3>
              <p className="text-[10px] text-zinc-400 font-mono">Executive gatekeeping controls</p>
            </div>
          </div>
          
          {pendingCount > 0 ? (
            <span className="font-mono text-[9px] bg-amber-950 text-amber-300 px-2 py-0.5 border border-amber-900 rounded-full animate-bounce">
              {pendingCount} WAITING SECURE AUTHORIZATION
            </span>
          ) : (
            <span className="font-mono text-[9px] bg-zinc-950 text-zinc-550 px-2 py-0.5 border border-zinc-850 rounded-full">
              ALL AUTHORIZED
            </span>
          )}
        </div>

        {/* Batch action operations panel */}
        {pendingCount > 0 && (
          <div className="flex items-center justify-between bg-zinc-950/80 border border-zinc-850 rounded-xl p-2 mt-1">
            <button
              id="select-all-btn"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-[10px] text-zinc-300 font-mono select-none hover:text-zinc-100 cursor-pointer min-h-[38px] px-2.5 rounded-lg hover:bg-zinc-900 transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare size={14} className="text-indigo-400" />
              ) : (
                <Square size={14} className="text-zinc-500" />
              )}
              <span>
                {isAllSelected ? "Clear Selection" : "Select All"} ({currentSelectedIds.length}/{pendingCount})
              </span>
            </button>

            {currentSelectedIds.length > 0 && (
              <div className="flex items-center gap-1.5 select-none">
                <button
                  id="batch-reject-btn"
                  onClick={() => {
                    if (onBatchDecide) {
                      onBatchDecide(currentSelectedIds, "rejected");
                    } else {
                      currentSelectedIds.forEach(id => onDecide(id, "rejected"));
                    }
                    setSelectedIds([]);
                  }}
                  className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 text-[10px] uppercase font-mono font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Decline selected actions"
                >
                  <X size={11} />
                  Reject ({currentSelectedIds.length})
                </button>
                <button
                  id="batch-approve-btn"
                  onClick={() => {
                    if (onBatchDecide) {
                      onBatchDecide(currentSelectedIds, "approved");
                    } else {
                      currentSelectedIds.forEach(id => onDecide(id, "approved"));
                    }
                    setSelectedIds([]);
                  }}
                  className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 text-[10px] uppercase font-mono font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-lg shadow-emerald-950/15"
                  title="Approve selected actions"
                >
                  <Check size={11} />
                  Approve ({currentSelectedIds.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Queue items mapping */}
      <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
        {approvals.length === 0 ? (
          <div className="text-center p-8 text-zinc-650 bg-zinc-950/20 border border-zinc-900/40 rounded-xl flex flex-col items-center justify-center">
            <ThumbsUp size={22} className="text-zinc-700 mb-1.5" />
            <p className="text-[10px] font-mono leading-relaxed max-w-xs text-zinc-500">
              NO ACTION PROMPTS QUEUED. THE SYSTEM DETECTED OPTIMAL WORKSPACE INTEGRITY.
            </p>
          </div>
        ) : (
          approvals.map((req) => {
            const isPending = req.status === "pending";
            const isSelected = currentSelectedIds.includes(req.id);
            
            const handleToggleSelectCard = () => {
              if (isSelected) {
                setSelectedIds(prev => prev.filter(id => id !== req.id));
              } else {
                setSelectedIds(prev => [...prev, req.id]);
              }
            };

            return (
              <div 
                id={`approval-card-${req.id}`}
                key={req.id}
                className={`border rounded-xl p-4 flex flex-col gap-3 transition-colors ${
                  isPending
                    ? isSelected
                      ? "bg-indigo-950/25 border-indigo-500/50 shadow-lg shadow-indigo-950/20"
                      : "bg-zinc-950 border-amber-900/40 hover:border-amber-500/15"
                    : req.status === "approved"
                    ? "bg-zinc-950 border-emerald-950/40 opacity-70"
                    : "bg-zinc-950 border-zinc-850/40 opacity-55"
                }`}
              >
                {/* Header metadata row */}
                <div className="flex items-center justify-between text-[10px] font-mono pb-2 border-b border-zinc-900">
                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <button
                        id={`select-card-${req.id}`}
                        onClick={handleToggleSelectCard}
                        className="text-zinc-500 hover:text-indigo-400 transition-colors p-1 -m-1 cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare size={13} className="text-indigo-400" />
                        ) : (
                          <Square size={13} className="text-zinc-600" />
                        )}
                      </button>
                    )}
                    <span className="flex items-center gap-1 font-semibold uppercase text-zinc-400">
                      <FileCode size={12} className="text-amber-500" />
                      ID-#{req.id.substring(req.id.length - 8)}
                    </span>
                  </div>
                  <span className="text-zinc-500 flex items-center gap-1 text-[9px]">
                    <Clock size={11} />
                    {new Date(req.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Description summary */}
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-sans font-semibold text-zinc-200">
                    {req.description}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-550 flex gap-1 items-center">
                    <span>AGENT:</span>
                    <span className="text-indigo-400">{req.agentId}</span>
                    <span>•</span>
                    <span>TYPE:</span>
                    <span className="text-amber-400">{req.actionType}</span>
                  </div>
                </div>

                {/* View payloads button details */}
                {req.payload && (
                  <div className="bg-zinc-900/50 rounded-lg border border-zinc-900">
                    <button
                      id={`toggle-payload-btn-${req.id}`}
                      onClick={() => setExpandedPayloadId(expandedPayloadId === req.id ? null : req.id)}
                      className="w-full flex items-center justify-between p-2 text-[9px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer select-none"
                    >
                      <span className="flex items-center gap-1.5 font-bold uppercase">
                        {expandedPayloadId === req.id ? <EyeOff size={11} /> : <Eye size={11} />}
                        {expandedPayloadId === req.id ? "Minimize payload parameters" : "Expand payload parameters"}
                      </span>
                      <span>{expandedPayloadId === req.id ? "CLOSE" : "VIEW DETAILS"}</span>
                    </button>

                    {expandedPayloadId === req.id && (
                      <div className="px-3 pb-3 border-t border-zinc-900 pt-2.5 max-h-[160px] overflow-y-auto font-mono text-[10px] text-zinc-300 leading-normal custom-scrollbar whitespace-pre-wrap break-all select-text">
                        <div className="text-amber-400 font-bold mb-1 border-b border-zinc-850 pb-1">Target Sandbox Path: ./agent_output/{req.payload.fileName}</div>
                        {req.payload.content}
                      </div>
                    )}
                  </div>
                )}

                {/* Action decides buttons row */}
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[9px] font-mono font-bold uppercase border px-2 py-0.5 rounded tracking-wider ${
                    req.status === "pending"
                      ? "bg-amber-950/20 border-amber-900/65 text-amber-300 animate-pulse"
                      : req.status === "approved"
                      ? "bg-emerald-950/20 border-emerald-900 text-emerald-300"
                      : "bg-red-950/20 border-red-900 text-red-300"
                  }`}>
                    STATUS: {req.status}
                  </span>

                  {req.status === "pending" && (
                    <div className="flex gap-2 text-[10px] font-mono select-none">
                      <button
                        id={`reject-btn-${req.id}`}
                        onClick={() => onDecide(req.id, "rejected")}
                        className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Decline action"
                      >
                        <X size={12} />
                        REJECT
                      </button>
                      <button
                        id={`approve-btn-${req.id}`}
                        onClick={() => onDecide(req.id, "approved")}
                        className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Grant approval"
                      >
                        <Check size={12} />
                        APPROVE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
