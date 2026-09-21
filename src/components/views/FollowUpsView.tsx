import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  User,
  ArrowUpRight,
  Filter,
  Wallet,
  Receipt,
  Search,
  Plus,
  GitCommit,
  Bell,
  Eye,
  DollarSign,
  FileCheck2,
  PhoneCall,
  CheckSquare,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { Task, PettyCashFund, Expense } from '../../types/domain';
import { formatDate, formatCurrency, TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '../../lib/utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TaskDetailsModal } from '../modals/TaskDetailsModal';
import { TaskChainModal } from '../modals/TaskChainModal';

interface FollowUpsViewProps {
  onSelectView: (view: string) => void;
  onOpenNewTask: () => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({ onSelectView, onOpenNewTask }) => {
  const [filterType, setFilterType] = useState<'all' | 'deferred' | 'overdue' | 'collections' | 'funds' | 'expenses'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [chainModalTask, setChainModalTask] = useState<Task | null>(null);

  const currentUser = dataStore.getCurrentUser();
  const tasks = dataStore.getTasks();
  const funds = dataStore.getFunds();
  const expenses = dataStore.getExpenses();

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Deferred / Follow-up tasks (مهام متابعة مرحلة أو تحتوي على سلسلة متابعة)
  const deferredTasks = tasks.filter(
    (t) => t.status === 'deferred' || (t.taskChain && t.taskChain.length > 1) || (t.outcome && t.outcome !== 'completed')
  );

  // 2. Overdue or Urgent tasks (متأخرة عن موعدها أو حرجة ولم تكتمل)
  const overdueTasks = tasks.filter(
    (t) => (t.dueDate < todayStr || t.priority === 'urgent') && t.status !== 'completed' && t.status !== 'approved'
  );

  // 3. Collections & Client visits follow-ups (متابعات تحصيل أو زيارات)
  const collectionTasks = tasks.filter(
    (t) => (t.category === 'تحصيل ومتابعة' || t.title.includes('تحصيل') || t.title.includes('دفعة') || t.title.includes('فاتورة')) &&
      t.status !== 'completed' && t.status !== 'approved'
  );

  // 4. Funds with low balance (عهد دون حد الأمان)
  const lowFunds = funds.filter(
    (f) => (f.currentBalance / f.totalAllocation) * 100 <= f.warningThreshold
  );

  // 5. Expenses pending approval
  const pendingExpenses = expenses.filter((e) => e.status === 'pending_approval');

  const totalAlerts = deferredTasks.length + overdueTasks.length + lowFunds.length + pendingExpenses.length;

  const handleNudge = (task: Task) => {
    const message = window.prompt(`إرسال تذكير ونكز للمنفذ (${task.assigneeName}):`, `يرجى سرعة تحديث حالة المهمة: ${task.title}`);
    if (message) {
      dataStore.addNotification({
        title: `تذكير بمتابعة عاجلة: ${task.title}`,
        message: `${currentUser.name}: ${message}`,
        type: 'warning',
        targetView: 'daily',
      });
      alert(`تم إرسال التنبيه للموظف ${task.assigneeName} بنجاح.`);
    }
  };

  const handleScheduleFollowUp = (parentTask: Task) => {
    const title = window.prompt('عنوان زيارة أو مهمة المتابعة اللاحقة:', `متابعة: ${parentTask.title}`);
    if (!title) return;

    const dueDate = window.prompt('تاريخ التنفيذ (YYYY-MM-DD):', todayStr);
    if (!dueDate) return;

    dataStore.addTask({
      title,
      description: `مهمة متابعة مستمرة للمهمة السابقة (${parentTask.id}) - العميل: ${parentTask.clientName || parentTask.location}`,
      status: 'scheduled',
      priority: 'high',
      startDate: todayStr,
      dueDate,
      assigneeId: parentTask.assigneeId,
      assigneeName: parentTask.assigneeName,
      location: parentTask.location,
      clientName: parentTask.clientName,
      budget: 0,
      tags: ['متابعة'],
      category: 'تحصيل ومتابعة',
      parentTaskId: parentTask.id,
      taskChain: [
        ...(parentTask.taskChain || [
          {
            id: parentTask.id,
            title: parentTask.title,
            status: parentTask.status,
            outcome: parentTask.outcome,
            date: parentTask.dueDate,
            assigneeName: parentTask.assigneeName,
          }
        ]),
        {
          id: `TASK-${Date.now().toString().slice(-4)}`,
          title,
          status: 'scheduled',
          date: dueDate,
          assigneeName: parentTask.assigneeName,
        }
      ],
      checklist: [
        { id: '1', text: 'التواصل مع المسؤول بالموقع وتأكيد الوصول', completed: false },
        { id: '2', text: 'استكمال الإجراء المعلق واستلام المستندات/المبالغ', completed: false },
        { id: '3', text: 'تسجيل نتيجة الزيارة وتوقيع العميل', completed: false }
      ]
    });

    alert('تمت جدولة مهمة المتابعة وربطها بالسلسلة بنجاح!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-3xl p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  لوحة المتابعات والمهام الحرجة (Follow-ups & Action Hub)
                </h2>
                <Badge variant="warning" size="md">
                  {totalAlerts} إجراء نشط
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                منظومة منع ضياع الأعمال: تتبع سلاسل المتابعة غير المكتملة، الزيارات المعلقة، التحصيل المالي، وتنبيهات السيولة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectView('daily')}
              className="text-xs border-amber-300 hover:bg-amber-100/50 font-bold"
            >
              لوحة اليوم
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewTask}
              icon={<Plus className="w-4 h-4" />}
              className="text-xs bg-amber-600 hover:bg-amber-700 font-bold"
            >
              جدولة مهمة عاجلة
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">متابعات مرحلة</span>
            <span className="text-lg font-black text-slate-900">{deferredTasks.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">متأخرة / SLA حرجة</span>
            <span className="text-lg font-black text-rose-700">{overdueTasks.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">متابعات تحصيل</span>
            <span className="text-lg font-black text-emerald-800">{collectionTasks.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">عهد دون حد الأمان</span>
            <span className="text-lg font-black text-amber-800">{lowFunds.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({totalAlerts})
          </button>
          <button
            onClick={() => setFilterType('deferred')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'deferred'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            متابعات متسلسلة ({deferredTasks.length})
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            متأخرة وحرجة ({overdueTasks.length})
          </button>
          <button
            onClick={() => setFilterType('collections')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'collections'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            تحصيل ومستحقات ({collectionTasks.length})
          </button>
          <button
            onClick={() => setFilterType('funds')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'funds'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            تنبيهات العهد ({lowFunds.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث في المتابعات والعملاء..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-3 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Grid of Alert Sections */}
      <div className="space-y-6">
        {/* Section 1: Deferred & Chained Follow-ups */}
        {(filterType === 'all' || filterType === 'deferred') && (
          <Card>
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-orange-600" />
                <CardTitle>سلاسل المتابعات والمهام غير المنجزة بالكامل ({deferredTasks.length})</CardTitle>
              </div>
              <span className="text-xs text-slate-500 font-medium">تم تحويلها لمتابعة منظمة بدلاً من ضياعها</span>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {deferredTasks.map((t) => (
                <div key={t.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {t.id}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{t.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-bold">
                        {t.outcomeReason ? `عائق: ${t.outcomeReason}` : 'متابعة لاحقة مجدولة'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {t.clientName || t.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        المكلف: {t.assigneeName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        التاريخ: {formatDate(t.dueDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setViewingTaskId(t.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>التفاصيل</span>
                    </button>

                    <button
                      onClick={() => setChainModalTask(t)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <GitCommit className="w-3.5 h-3.5" />
                      <span>مسار السلسلة ({t.taskChain?.length || 1})</span>
                    </button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleScheduleFollowUp(t)}
                      className="text-xs bg-orange-600 hover:bg-orange-700 font-bold"
                    >
                      + جدولة زيارة متابعة
                    </Button>
                  </div>
                </div>
              ))}

              {deferredTasks.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
                  لا توجد مهام مرحلة معلقة حالياً، جميع المتابعات مغلقة بنجاح.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section 2: Overdue / Critical SLA Tasks */}
        {(filterType === 'all' || filterType === 'overdue') && (
          <Card>
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <CardTitle>مهام ميدانية متأخرة أو حرجة وتتطلب تدخلاً فورياً ({overdueTasks.length})</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectView('tasks')}
                className="text-xs text-indigo-600 font-bold"
              >
                إدارة المهام
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {overdueTasks.map((t) => (
                <div key={t.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {t.id}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{t.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        تاريخ الاستحقاق: {formatDate(t.dueDate)} {t.dueDate < todayStr ? '(متأخرة)' : '(عاجلة)'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {t.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        المنفذ: <strong>{t.assigneeName}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleNudge(t)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>نكز وتذكير</span>
                    </button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingTaskId(t.id)}
                      className="text-xs border-indigo-200 text-indigo-700 font-bold"
                    >
                      متابعة الإنجاز
                    </Button>
                  </div>
                </div>
              ))}

              {overdueTasks.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
                  لا توجد مهام متأخرة حالياً، جميع العمليات ضمن النطاق الزمني المحدد.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section 3: Collection Follow-ups */}
        {(filterType === 'all' || filterType === 'collections') && (
          <Card>
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <CardTitle>متابعات التحصيل والدفعات المالية ({collectionTasks.length})</CardTitle>
              </div>
              <span className="text-xs text-slate-500 font-medium">متابعة الفواتير والدفعات المعلقة مع العملاء</span>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {collectionTasks.map((t) => (
                <div key={t.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{t.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        استحقاق التحصيل: {formatDate(t.dueDate)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>العميل: <strong>{t.clientName || 'مؤسسة تجارية'}</strong></span>
                      <span>•</span>
                      <span>المسؤول المكلف بالتحصيل: {t.assigneeName}</span>
                      <span>•</span>
                      <span className="text-slate-700 font-bold">الموقع: {t.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingTaskId(t.id)}
                      className="text-xs font-bold"
                    >
                      تسجيل نتيجة التحصيل
                    </Button>
                  </div>
                </div>
              ))}

              {collectionTasks.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
                  لا توجد مطالبات تحصيل معلقة في الوقت الحالي.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section 4: Low Petty Cash Funds */}
        {(filterType === 'all' || filterType === 'funds') && (
          <Card>
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-600" />
                <CardTitle>صناديق عهد نقدية بحاجة لتغذية أو تسوية ({lowFunds.length})</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectView('funds')}
                className="text-xs text-indigo-600 font-bold"
              >
                صناديق العهد
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {lowFunds.map((f) => {
                const percent = Math.round((f.currentBalance / f.totalAllocation) * 100);

                return (
                  <div key={f.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{f.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">({f.code})</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        أمين العهدة: {f.holderName} ({f.holderDepartment})
                      </p>
                    </div>

                    <div className="text-left shrink-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-600 dir-ltr block">
                          متبقي: {formatCurrency(f.currentBalance, f.currency)} ({percent}%)
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectView('funds')}
                        className="text-xs border-amber-200 text-amber-800 font-bold"
                      >
                        طلب تغذية الرصيد
                      </Button>
                    </div>
                  </div>
                );
              })}

              {lowFunds.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
                  جميع العهد النقدية تحتفظ بسيولة كافية أعلى من حد التنبيه.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task Details Modal */}
      {viewingTaskId && (
        <TaskDetailsModal
          taskId={viewingTaskId}
          isOpen={!!viewingTaskId}
          onClose={() => setViewingTaskId(null)}
        />
      )}

      {/* Task Chain Modal */}
      {chainModalTask && (
        <TaskChainModal
          task={chainModalTask}
          isOpen={!!chainModalTask}
          onClose={() => setChainModalTask(null)}
        />
      )}
    </div>
  );
};
