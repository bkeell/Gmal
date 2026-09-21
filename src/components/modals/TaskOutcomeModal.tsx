import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ArrowRight, 
  Calendar, 
  User, 
  UploadCloud, 
  FileText,
  HelpCircle
} from 'lucide-react';
import { Task, TaskOutcome, TaskOutcomeReason } from '../../types/domain';
import { dataStore } from '../../lib/storage';

interface TaskOutcomeModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const OUTCOME_OPTIONS: Array<{
  id: TaskOutcome;
  title: string;
  desc: string;
  icon: React.ElementType;
  badgeBg: string;
  borderActive: string;
}> = [
  {
    id: 'completed',
    title: 'تم الإنجاز بالكامل',
    desc: 'تم استيفاء كافة المتطلبات والشروط والبنود بنجاح.',
    icon: CheckCircle2,
    badgeBg: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    borderActive: 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20',
  },
  {
    id: 'partially_completed',
    title: 'تم الإنجاز جزئياً',
    desc: 'تم إنجاز جزء من البنود وبقيت أعمال تحتاج متابعة.',
    icon: AlertTriangle,
    badgeBg: 'text-amber-700 bg-amber-50 border-amber-200',
    borderActive: 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20',
  },
  {
    id: 'needs_followup',
    title: 'يحتاج متابعة تكميلية',
    desc: 'المهمة عالقة بانتظار رد، اعتماد، أو زيارة أخرى.',
    icon: Clock,
    badgeBg: 'text-blue-700 bg-blue-50 border-blue-200',
    borderActive: 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20',
  },
  {
    id: 'unable_to_execute',
    title: 'تعذر التنفيذ',
    desc: 'عائق قاهر في الموقع أو إغلاق الجهة حال دون التنفيذ.',
    icon: XCircle,
    badgeBg: 'text-rose-700 bg-rose-50 border-rose-200',
    borderActive: 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-500/20',
  },
  {
    id: 'not_completed',
    title: 'لم يتم الإنجاز',
    desc: 'لم يبدأ العمل أو تم إلغاؤه لأسباب إدارية أو تشغيلية.',
    icon: XCircle,
    badgeBg: 'text-slate-700 bg-slate-50 border-slate-200',
    borderActive: 'border-slate-600 bg-slate-50/50 ring-2 ring-slate-500/20',
  },
];

const REASONS_LIST: Array<{ id: TaskOutcomeReason; label: string }> = [
  { id: 'client_unavailable', label: 'العميل غير موجود أو تعذر التواصل معه' },
  { id: 'document_missing', label: 'المستند / كشف الحساب / العقد ناقص' },
  { id: 'payment_pending', label: 'لم يتم التحويل أو سداد المبلغ المطلوب' },
  { id: 'needs_approval', label: 'تحتاج موافقة إدارية أو مالية عليا' },
  { id: 'client_postponed', label: 'تأجيل بطلب رسمي من العميل / المنشأة' },
  { id: 'technical_blocker', label: 'عائق تقني في الموقع أو انقطاع الخدمات' },
  { id: 'weather_conditions', label: 'ظروف مناخية قاهرة أو أحوال سلامة عامة' },
  { id: 'other', label: 'سبب آخر (توضيح بالتفصيل في الملاحظات)' },
];

export const TaskOutcomeModal: React.FC<TaskOutcomeModalProps> = ({
  task,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !task) return null;

  const users = dataStore.getUsers();
  const [selectedOutcome, setSelectedOutcome] = useState<TaskOutcome>('completed');
  const [selectedReason, setSelectedReason] = useState<string>('client_unavailable');
  const [customReasonText, setCustomReasonText] = useState('');
  const [notes, setNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Follow-up chain toggle & form
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [followUpTitle, setFollowUpTitle] = useState(`متابعة تكميلية: ${task.title}`);
  const [followUpDate, setFollowUpDate] = useState(tomorrowDate);
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [followUpAssigneeId, setFollowUpAssigneeId] = useState(task.assigneeId);
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Auto-enable follow up suggestion when outcome is incomplete
  const handleSelectOutcome = (outcome: TaskOutcome) => {
    setSelectedOutcome(outcome);
    if (outcome !== 'completed') {
      setCreateFollowUp(true);
      const reasonLabel = REASONS_LIST.find((r) => r.id === selectedReason)?.label || '';
      setFollowUpTitle(`متابعة: ${task.title} - ${reasonLabel}`);
    } else {
      setCreateFollowUp(false);
    }
  };

  const handleReasonChange = (reasonId: string) => {
    setSelectedReason(reasonId);
    const reasonObj = REASONS_LIST.find((r) => r.id === reasonId);
    if (reasonObj) {
      setFollowUpTitle(`متابعة: ${task.title} (${reasonObj.label})`);
    }
  };

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setProofUrl('https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80');
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isNonCompleted = selectedOutcome !== 'completed';
    const finalReason = isNonCompleted
      ? selectedReason === 'other'
        ? customReasonText || 'سبب آخر غير محدد'
        : REASONS_LIST.find((r) => r.id === selectedReason)?.label || selectedReason
      : undefined;

    const followUpPayload = (isNonCompleted && createFollowUp) ? {
      title: followUpTitle || `متابعة: ${task.title}`,
      dueDate: followUpDate,
      dueTime: followUpTime,
      reason: finalReason,
      notes: followUpNotes,
      assigneeId: followUpAssigneeId,
      assigneeName: users.find((u) => u.id === followUpAssigneeId)?.name || task.assigneeName,
    } : undefined;

    dataStore.recordTaskOutcome(task.id, {
      outcome: selectedOutcome,
      reason: finalReason,
      notes,
      proofUrl,
      followUp: followUpPayload,
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="task-outcome-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">إغلاق وتسجيل نتيجة المهمة</h3>
              <p className="text-xs text-slate-300 line-clamp-1 max-w-md">{task.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Requirement Info */}
          {task.proofRequired && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">المطلوب إثباته في هذه المهمة: </span>
                {task.proofRequired}
              </div>
            </div>
          )}

          {/* Outcome Options Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              نتيجة التنفيذ الفعلية <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OUTCOME_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = selectedOutcome === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOutcome(opt.id)}
                    className={`text-right p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? opt.borderActive
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 border ${opt.badgeBg}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-800 flex items-center justify-between">
                        <span>{opt.title}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mandatory Reason for Incomplete Outcomes */}
          {selectedOutcome !== 'completed' && (
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-amber-900">
                سبب عدم الإنجاز أو الحاجة للمتابعة (إلزامي) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => handleReasonChange(e.target.value)}
                className="w-full text-sm rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {REASONS_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>

              {selectedReason === 'other' && (
                <input
                  type="text"
                  placeholder="يرجى توضيح السبب بدقة..."
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  className="w-full text-sm rounded-lg border border-amber-300 bg-white px-3 py-2 text-slate-800"
                  required
                />
              )}
            </div>
          )}

          {/* Follow-up Chain Section (Central Feature) */}
          {selectedOutcome !== 'completed' && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h4 className="font-bold text-sm text-indigo-950">
                      إنشاء مهمة متابعة تكميلية (Task Chain)
                    </h4>
                    <p className="text-xs text-indigo-700 mt-0.5">
                      ترحيل العمل غير المنجز فوراً إلى مهمة لاحقة مرتبطة بالسلسلة لمنع النسيان.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createFollowUp}
                    onChange={(e) => setCreateFollowUp(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {createFollowUp && (
                <div className="space-y-3 pt-2 border-t border-indigo-200/60 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      عنوان مهمة المتابعة
                    </label>
                    <input
                      type="text"
                      value={followUpTitle}
                      onChange={(e) => setFollowUpTitle(e.target.value)}
                      className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        تاريخ المتابعة
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        وقت المتابعة
                      </label>
                      <input
                        type="time"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        الموظف المسؤول
                      </label>
                      <select
                        value={followUpAssigneeId}
                        onChange={(e) => setFollowUpAssigneeId(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.roleTitleAr})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ملاحظات وتوجيهات المتابعة التكميلية
                    </label>
                    <input
                      type="text"
                      placeholder="مثل: اصطحاب كشف الحساب الأصلي، الاتصال قبل التحرك بنصف ساعة..."
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Proof / Document Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              إثبات التنفيذ والمرفقات (صورة، مستند، سند موقع)
            </label>
            {proofUrl ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>تم إرفاق المستند بنجاح (معتمد للمراجعة)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProofUrl('')}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  إزالة
                </button>
              </div>
            ) : (
              <div 
                onClick={handleSimulateUpload}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-xl p-4 text-center cursor-pointer transition-colors"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">
                  {isUploading ? 'جاري الرفع والمعالجة...' : 'انقر لرفع صورة الفاتورة أو المستند المختوم أو محضر الإنجاز'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, PDF حتى 10 ميجابايت</p>
              </div>
            )}
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ملاحظات ختامية للمشرف / المدير
            </label>
            <textarea
              rows={2}
              placeholder="سجل أي ملحوظة تمت أثناء الزيارة أو تفاصيل التحصيل أو حالة العميل..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 ${
              selectedOutcome === 'completed'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {selectedOutcome === 'completed'
                ? 'إغلاق وإرسال للاعتماد'
                : createFollowUp
                ? 'حفظ النتيجة وتوليد المتابعة'
                : 'تسجيل النتيجة وحفظ'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
