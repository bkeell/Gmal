import React from 'react';
import { X, GitCommit, ArrowDown, Calendar, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Task } from '../../types/domain';

interface TaskChainModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskChainModal: React.FC<TaskChainModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !task) return null;

  const chain = task.taskChain || [
    {
      id: task.id,
      title: task.title,
      status: task.status,
      outcome: task.outcome,
      outcomeReason: typeof task.outcomeReason === 'string' ? task.outcomeReason : undefined,
      date: task.dueDate,
      assigneeName: task.assigneeName,
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">سلسلة مسار المهمة والمتابعات (Task Chain)</h3>
              <p className="text-xs text-slate-300 line-clamp-1">{task.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="relative border-r-2 border-indigo-100 pr-6 space-y-6 mr-3">
            {chain.map((node, index) => {
              const isCurrent = node.id === task.id;
              const isCompleted = node.status === 'completed' || node.status === 'approved';
              return (
                <div key={node.id || index} className="relative group">
                  {/* Node icon */}
                  <div
                    className={`absolute -right-[33px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-transform ${
                      isCurrent
                        ? 'bg-indigo-600 border-indigo-200 text-white ring-4 ring-indigo-100 scale-110'
                        : isCompleted
                        ? 'bg-emerald-600 border-emerald-200 text-white'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Card */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-indigo-50/50 border-indigo-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className="font-bold text-sm text-slate-900">
                        {node.title}
                        {isCurrent && (
                          <span className="mr-2 text-[11px] font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                            المهمة الحالية
                          </span>
                        )}
                      </h4>
                      <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {node.date}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {node.assigneeName}
                      </span>

                      {node.outcome && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                          النتيجة: {node.outcome}
                        </span>
                      )}

                      {node.outcomeReason && (
                        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px]">
                          العائق: {node.outcomeReason}
                        </span>
                      )}
                    </div>
                  </div>

                  {index < chain.length - 1 && (
                    <div className="flex justify-center -mb-2 mt-1">
                      <ArrowDown className="w-4 h-4 text-indigo-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 rounded-xl"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
