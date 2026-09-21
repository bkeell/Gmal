import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  MessageSquare,
  Paperclip,
  History,
  Send,
  Upload,
  ExternalLink,
  ShieldAlert,
  Play,
  Square,
  CheckSquare,
  SquareDashed,
  Trash2,
  Eye,
  Bell,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Phone,
  Building2,
  Lock,
} from 'lucide-react';
import { Task, TaskComment, TaskAttachment, TaskStatus } from '../../types/domain';
import { dataStore } from '../../lib/storage';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, formatCurrency } from '../../lib/utils/format';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface TaskDetailsModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenOutcomeModal?: (task: Task) => void;
  onOpenNewExpense?: (taskId?: string) => void;
  onOpenChainModal?: (task: Task) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onOpenOutcomeModal,
  onOpenNewExpense,
  onOpenChainModal,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'attachments' | 'financials' | 'history'>('overview');
  const [newCommentText, setNewCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reworkModalOpen, setReworkModalOpen] = useState(false);
  const [reworkInstructions, setReworkInstructions] = useState('');
  const [uploadMockName, setUploadMockName] = useState('');
  const [uploadMockType, setUploadMockType] = useState('image');

  if (!isOpen || !taskId) return null;

  const tasks = dataStore.getTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const currentUser = dataStore.getCurrentUser();
  const isSupervisorOrAdmin = currentUser.role === 'admin' || currentUser.role === 'ops_manager';
  const statusConfig = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.todo;
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.medium;

  const expenses = dataStore.getExpenses().filter((e) => e.taskId === task.id);
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.totalWithTax, 0);

  const handleToggleChecklist = (checkId: string) => {
    dataStore.toggleTaskChecklistItem(task.id, checkId);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    dataStore.addTaskComment(task.id, newCommentText.trim(), isInternalComment);
    setNewCommentText('');
  };

  const handleAddMockAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadMockName.trim()) return;
    const icons: Record<string, string> = {
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      doc: '#',
      receipt: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600',
    };
    dataStore.addTaskAttachment(task.id, {
      name: uploadMockName.trim(),
      url: icons[uploadMockType] || icons.image,
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      type: uploadMockType,
    });
    setUploadMockName('');
  };

  const handleDeleteAttachment = (attId: string) => {
    if (window.confirm('هل تريد بالتأكيد حذف هذا المرفق؟')) {
      dataStore.deleteTaskAttachment(task.id, attId);
    }
  };

  const handleApprove = () => {
    const notes = window.prompt('ملاحظات الاعتماد (اختياري):', 'تمت مراجعة النتيجة وتأكيد صحتها');
    if (notes !== null) {
      dataStore.approveTask(task.id, notes);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      alert('يرجى تحديد سبب الرفض');
      return;
    }
    dataStore.rejectTask(task.id, rejectionReason.trim());
    setRejectionModalOpen(false);
    setRejectionReason('');
  };

  const handleConfirmRework = () => {
    if (!reworkInstructions.trim()) {
      alert('يرجى كتابة توجيهات الاستكمال والتعديل');
      return;
    }
    dataStore.sendTaskForRework(task.id, reworkInstructions.trim());
    setReworkModalOpen(false);
    setReworkInstructions('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto text-slate-800">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300 font-bold">
                {task.id}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${priorityConfig.color} bg-white/10`}>
                أولوية {priorityConfig.label}
              </span>
              {task.taskType && (
                <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 px-2 py-0.5 rounded-full text-[11px] font-medium">
                  {task.taskType}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white truncate">
              {task.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer Button */}
            {task.isTimerRunning ? (
              <button
                onClick={() => dataStore.stopTaskTimer(task.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md transition cursor-pointer animate-pulse"
                title="إيقاف عداد الوقت وحفظ الدقائق"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>إيقاف المؤقت ({task.timeSpentMinutes || 0} د)</span>
              </button>
            ) : (
              <button
                onClick={() => dataStore.startTaskTimer(task.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition cursor-pointer"
                title="بدء احتساب دقائق العمل الفعلي"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>بدء المؤقت {task.timeSpentMinutes ? `(${task.timeSpentMinutes} د)` : ''}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Supervisor Action Bar (If pending approval or needs review) */}
        {isSupervisorOrAdmin && task.status === 'pending_approval' && (
          <div className="bg-purple-50 border-b border-purple-200/80 p-4 px-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-purple-900">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <p className="text-xs font-extrabold">هذه المهمة مكتملة وبانتظار اعتمادك الإشرافي</p>
                <p className="text-[11px] text-purple-700">قام {task.assigneeName} بتسليم المهمة وإرفاق الإثباتات المطلوبة.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleApprove}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد المهمة</span>
              </button>
              <button
                onClick={() => setReworkModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة للتعديل</span>
              </button>
              <button
                onClick={() => setRejectionModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>رفض النتيجة</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-slate-200 bg-slate-50/70 px-6 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>نظرة عامة والمهام</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'comments'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>المناقشة والتوجيهات</span>
            {task.comments && task.comments.length > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] rounded-full font-bold">
                {task.comments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('attachments')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'attachments'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>المستندات وإثباتات الإنجاز</span>
            {task.attachments && task.attachments.length > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] rounded-full font-bold">
                {task.attachments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'financials'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>المصروفات والعهدة</span>
            {expenses.length > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                {expenses.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل الحركات والتدقيق</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Outcome Banner if recorded */}
              {task.outcome && (
                <div className={`p-4 rounded-2xl border ${
                  task.outcome === 'completed'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className={`w-5 h-5 mt-0.5 ${task.outcome === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <div>
                        <span className="text-xs font-bold">النتيجة المسجلة: </span>
                        <span className="text-xs font-extrabold">
                          {task.outcome === 'completed' ? 'تم الإنجاز بالكامل' : task.outcome === 'partially_completed' ? 'تم الإنجاز جزئياً' : 'متابعة ميدانية'}
                        </span>
                        {task.outcomeReason && (
                          <p className="text-xs mt-1 text-slate-700">
                            <strong>السبب المسجل:</strong> {task.outcomeReason}
                          </p>
                        )}
                        {task.outcomeNotes && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            <strong>ملاحظات المنفذ:</strong> {task.outcomeNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    {task.parentTaskId || task.taskChain ? (
                      <button
                        onClick={() => onOpenChainModal && onOpenChainModal(task)}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>عرض سلسلة المتابعات</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Rejection / Rework alerts if any */}
              {task.status === 'rejected' && task.rejectionReason && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold">تم رفض إنجاز المهمة من قبل المشرف</span>
                    <p className="text-xs mt-0.5 text-rose-800">سبب الرفض: {task.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 block mb-1">وصف وتفاصيل المهمة</span>
                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {task.description || 'لا يوجد وصف تفصيلي إضافي.'}
                </p>
              </div>

              {/* Key Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <User className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 block">المسؤول عن التنفيذ</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">{task.assigneeName}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 block">تاريخ ووقت الاستحقاق</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {task.dueDate} {task.dueTime ? `(${task.dueTime})` : ''}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-slate-500 block">الموقع الميداني</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 truncate">{task.location}</span>
                      {task.mapsUrl && (
                        <a
                          href={task.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 text-[11px] font-bold flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>خرائط</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {task.clientName && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-purple-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 block">العميل / الجهة</span>
                      <span className="text-xs font-bold text-slate-800 truncate block">{task.clientName}</span>
                      {task.clientPhone && (
                        <a href={`tel:${task.clientPhone}`} className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-mono">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{task.clientPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {task.proofRequired && (
                  <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-amber-800 font-bold block">إثبات التنفيذ المشروط</span>
                      <span className="text-xs font-extrabold text-amber-950 truncate block">{task.proofRequired}</span>
                    </div>
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 block">وقت الإنجاز الفعلي</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {task.timeSpentMinutes ? `${task.timeSpentMinutes} دقيقة عمل` : 'لم يسجل وقت بعد'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checklist Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    <span>قائمة المهام الإجرائية ({task.checklist.filter((c) => c.completed).length} / {task.checklist.length})</span>
                  </span>
                </div>

                <div className="space-y-2">
                  {task.checklist.map((chk) => (
                    <button
                      key={chk.id}
                      onClick={() => handleToggleChecklist(chk.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-right transition cursor-pointer ${
                        chk.completed
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-white border-slate-200 hover:border-indigo-200 text-slate-700'
                      }`}
                    >
                      {chk.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <SquareDashed className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <span className={`text-xs sm:text-sm font-medium ${chk.completed ? 'line-through text-slate-500' : ''}`}>
                        {chk.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Action bar inside modal */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {onOpenOutcomeModal && task.status !== 'completed' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onOpenOutcomeModal(task)}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      تسجيل نتيجة الإنجاز (Outcome)
                    </Button>
                  )}

                  {onOpenNewExpense && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenNewExpense(task.id)}
                      icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
                    >
                      إضافة مصروف للمهمة
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const msg = window.prompt('رسالة التذكير والنكز:', 'يرجى الإسراع في إنهاء المهمة وتحديث النتيجة');
                      if (msg) dataStore.nudgeTask(task.id, currentUser.name, msg);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>نكز الموظف</span>
                  </button>

                  <button
                    onClick={() => {
                      const reason = window.prompt('سبب طلب التدخل والمساعدة العاجلة (SOS):', 'تعطل المعدة أو عائق في الموقع');
                      if (reason) dataStore.requestTaskHelp(task.id, currentUser.name, 'الدعم الميداني', reason);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>طلب استغاثة (SOS)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMMENTS & DISCUSSION */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              {/* Existing Comments List */}
              <div className="space-y-3">
                {(!task.comments || task.comments.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
                    <p className="text-xs font-bold">لا توجد مناقشات أو ملاحظات مسجلة بعد</p>
                    <p className="text-[11px] text-slate-400">يمكن للمشرفين والمنفذين تبادل الملاحظات والتوجيهات الميدانية هنا.</p>
                  </div>
                ) : (
                  task.comments.map((cmt) => (
                    <div
                      key={cmt.id}
                      className={`p-4 rounded-2xl border ${
                        cmt.isInternal
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center">
                            {cmt.authorName.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800">{cmt.authorName}</span>
                            {cmt.authorRole && (
                              <span className="text-[10px] text-slate-500 mr-2 bg-slate-100 px-1.5 py-0.5 rounded">
                                {cmt.authorRole}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {cmt.isInternal && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              <Lock className="w-2.5 h-2.5" />
                              <span>ملاحظة داخلية للإدارة</span>
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">{cmt.createdAt}</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line pr-9">
                        {cmt.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input Box */}
              <form onSubmit={handleAddComment} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">إضافة تعليق أو توجيه إداري</span>
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="اكتب ملاحظتك أو توجيهك هنا..."
                  rows={3}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>ملاحظة إدارية سرية (تظهر للمشرفين والمديرين فقط)</span>
                  </label>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newCommentText.trim()}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    إرسال التعليق
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ATTACHMENTS HUB */}
          {activeTab === 'attachments' && (
            <div className="space-y-6">
              {/* Proof highlight */}
              {task.proofRequired && (
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-indigo-950">المستند المطلوب كإثبات لإغلاق المهمة:</span>
                      <p className="text-xs font-extrabold text-indigo-700">{task.proofRequired}</p>
                    </div>
                  </div>
                  {task.attachments && task.attachments.length > 0 ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تم إرفاق المستندات</span>
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                      بانتظار الرفع
                    </span>
                  )}
                </div>
              )}

              {/* Attachments List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  المرفقات المرفوعة ({task.attachments ? task.attachments.length : 0})
                </span>

                {(!task.attachments || task.attachments.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                    <Paperclip className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
                    <p className="text-xs font-bold">لم يتم رفع أي مستندات أو صور بعد</p>
                    <p className="text-[11px] text-slate-400">ارفع الفواتير، صور الموقع، أو محاضر التسليم أدناه.</p>
                  </div>
                ) : (
                  task.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          {att.type === 'pdf' ? <FileText className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate block">{att.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {att.size} • تم الرفع بواسطة {att.uploadedBy} • {att.uploadedAt}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition"
                          title="معاينة المستند"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                          title="حذف المرفق"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Upload Box */}
              <form onSubmit={handleAddMockAttachment} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">رفع مستند أو إثبات جديد</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="اسم المستند (مثال: محضر تسليم العميل، إيصال استلام، صورة العداد)"
                      value={uploadMockName}
                      onChange={(e) => setUploadMockName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <select
                      value={uploadMockType}
                      onChange={(e) => setUploadMockType(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden"
                    >
                      <option value="image">صورة فوتوغرافية (JPG/PNG)</option>
                      <option value="pdf">وثيقة PDF معتمدة</option>
                      <option value="receipt">سند / إيصال مالي</option>
                      <option value="doc">تقرير نصي أو محضر</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!uploadMockName.trim()}
                    icon={<Upload className="w-3.5 h-3.5" />}
                  >
                    حفظ وإرفاق المستند
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: FINANCIALS & EXPENSES */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              {/* Financial KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-1">الميزانية التقديرية للمهمة</span>
                  <span className="text-base font-extrabold text-slate-900">{formatCurrency(task.budget)}</span>
                </div>
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 block mb-1">إجمالي المصروفات المسجلة</span>
                  <span className="text-base font-extrabold text-emerald-900">{formatCurrency(totalExpensesAmount)}</span>
                </div>
                <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200">
                  <span className="text-[11px] text-blue-700 block mb-1">المتبقي من الميزانية</span>
                  <span className={`text-base font-extrabold ${task.budget - totalExpensesAmount < 0 ? 'text-rose-600' : 'text-blue-900'}`}>
                    {formatCurrency(task.budget - totalExpensesAmount)}
                  </span>
                </div>
              </div>

              {/* Linked Expenses List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">الفواتير والمصروفات المرتبطة بهذه المهمة</span>
                  {onOpenNewExpense && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenNewExpense(task.id)}
                      icon={<DollarSign className="w-3.5 h-3.5 text-emerald-600" />}
                    >
                      تسجيل فاتورة جديدة
                    </Button>
                  )}
                </div>

                {expenses.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                    <DollarSign className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
                    <p className="text-xs font-bold">لا توجد مصروفات مسجلة على هذه المهمة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-700">{exp.code}</span>
                            <span className="text-xs font-bold text-slate-900">{exp.vendorName}</span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {exp.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">{exp.description}</span>
                        </div>

                        <div className="text-left shrink-0">
                          <span className="text-xs sm:text-sm font-extrabold text-emerald-700 block">
                            {formatCurrency(exp.totalWithTax)}
                          </span>
                          <span className="text-[10px] text-slate-400">{exp.submittedAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOG & HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700 block">
                التسلسل الزمني لكافة العمليات والتعديلات
              </span>

              <div className="relative pl-4 space-y-4 before:absolute before:top-2 before:bottom-2 before:right-2.5 before:w-0.5 before:bg-slate-200">
                {task.history.slice().reverse().map((h) => (
                  <div key={h.id} className="relative pr-7">
                    <div className="absolute right-1 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-indigo-600 shadow-xs" />
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-800">{h.action}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>بواسطة: {h.performedBy}</span>
                        <span>{h.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            رقم المهمة: {task.id} • تاريخ الإنشاء: {task.createdAt}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>

      </div>

      {/* Sub-modal for Rejection Reason */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-extrabold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>رفض نتيجة إنجاز المهمة</span>
            </h3>
            <p className="text-xs text-slate-600">
              يرجى توضيح سبب الرفض بالتفصيل حتى يتمكن الموظف من معالجة الخلل.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: لم يتم إرفاق المستند المختوم، أو تبين عدم تواجد العميل..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectionModalOpen(false)}>
                إلغاء
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmReject} disabled={!rejectionReason.trim()}>
                تأكيد الرفض
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal for Rework Instructions */}
      {reworkModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-extrabold text-amber-800 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <span>إعادة المهمة للتعديل واستكمال النواقص</span>
            </h3>
            <p className="text-xs text-slate-600">
              حدد التوجيهات الإشرافية المطلوبة من الموظف قبل اعتماد المهمة.
            </p>
            <textarea
              rows={3}
              value={reworkInstructions}
              onChange={(e) => setReworkInstructions(e.target.value)}
              placeholder="مثال: يرجى إعادة التقاط صورة واضحة للختم وتصحيح تاريخ الاستلام..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setReworkModalOpen(false)}>
                إلغاء
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmRework} disabled={!reworkInstructions.trim()} className="bg-amber-600 hover:bg-amber-700">
                إرسال للتعديل
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
