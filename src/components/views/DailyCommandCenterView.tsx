import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Clock, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Plus, 
  Receipt, 
  MapPin, 
  ExternalLink, 
  GitCommit, 
  Bell, 
  LifeBuoy, 
  ChevronDown, 
  ChevronUp, 
  Building, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Filter, 
  Search,
  Wallet,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, User } from '../../types/domain';
import { dataStore } from '../../lib/storage';
import { formatCurrency } from '../../lib/utils/format';
import { TaskOutcomeModal } from '../modals/TaskOutcomeModal';
import { TaskChainModal } from '../modals/TaskChainModal';
import { NewExpenseModal } from '../modals/NewExpenseModal';
import { TaskDetailsModal } from '../modals/TaskDetailsModal';

interface DailyCommandCenterProps {
  onOpenNewTask: () => void;
  onSelectView: (view: string) => void;
}

export const DailyCommandCenterView: React.FC<DailyCommandCenterProps> = ({
  onOpenNewTask,
  onSelectView,
}) => {
  const [currentUser, setCurrentUser] = useState<User>(dataStore.getCurrentUser());
  const [tasks, setTasks] = useState<Task[]>(dataStore.getTasks());
  const [settings] = useState(dataStore.getSettings());
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'overdue' | 'upcoming' | 'pending_approval' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<'my_tasks' | 'all_team'>('my_tasks');
  const [expandedChecklistTaskId, setExpandedChecklistTaskId] = useState<string | null>(null);

  // Modals state
  const [viewingDetailsTaskId, setViewingDetailsTaskId] = useState<string | null>(null);
  const [selectedTaskForOutcome, setSelectedTaskForOutcome] = useState<Task | null>(null);
  const [selectedTaskForChain, setSelectedTaskForChain] = useState<Task | null>(null);
  const [selectedTaskForExpense, setSelectedTaskForExpense] = useState<Task | null>(null);
  const [nudgeModalTask, setNudgeModalTask] = useState<Task | null>(null);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [sosModalTask, setSosModalTask] = useState<Task | null>(null);
  const [sosReason, setSosReason] = useState('');
  const [sosDepartment, setSosDepartment] = useState('الإدارة المالية');

  // Realtime subscription
  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setTasks([...dataStore.getTasks()]);
      setCurrentUser({ ...dataStore.getCurrentUser() });
    });
    return unsub;
  }, []);

  // Today Date String
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks based on scope and search
  const scopedTasks = tasks.filter((t) => {
    if (filterScope === 'my_tasks' && currentUser.role !== 'admin' && currentUser.role !== 'ops_manager') {
      return t.assigneeId === currentUser.id;
    }
    if (filterScope === 'my_tasks') {
      // For managers, show their own or their direct subordinates
      return t.assigneeId === currentUser.id || t.supervisorId === currentUser.id;
    }
    return true;
  });

  const searchedTasks = scopedTasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.clientName && t.clientName.toLowerCase().includes(q)) ||
      t.location.toLowerCase().includes(q) ||
      (t.taskType && t.taskType.toLowerCase().includes(q))
    );
  });

  // Categorization
  const activeTasks = searchedTasks.filter((t) => 
    t.status === 'started' || t.status === 'in_progress' || t.isTimerRunning
  );

  const overdueTasks = searchedTasks.filter((t) => {
    const isDone = t.status === 'completed' || t.status === 'approved' || t.status === 'cancelled';
    return !isDone && t.dueDate < todayStr;
  });

  const upcomingTasks = searchedTasks.filter((t) => 
    (t.status === 'new' || t.status === 'scheduled' || t.status === 'todo') && t.dueDate >= todayStr
  );

  const pendingApprovalTasks = searchedTasks.filter((t) => 
    t.status === 'pending_approval' || t.status === 'review'
  );

  const completedTasks = searchedTasks.filter((t) => 
    t.status === 'completed' || t.status === 'approved'
  );

  // Tab Filtering
  const displayedTasks = (() => {
    switch (activeTab) {
      case 'active':
        return activeTasks;
      case 'overdue':
        return overdueTasks;
      case 'upcoming':
        return upcomingTasks;
      case 'pending_approval':
        return pendingApprovalTasks;
      case 'completed':
        return completedTasks;
      case 'all':
      default:
        return searchedTasks;
    }
  })();

  // Handlers
  const handleToggleTimer = (task: Task) => {
    if (task.isTimerRunning) {
      dataStore.stopTaskTimer(task.id);
    } else {
      dataStore.startTaskTimer(task.id);
    }
  };

  const handleSendNudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nudgeModalTask) return;
    dataStore.nudgeTask(nudgeModalTask.id, currentUser.name, nudgeMessage.trim() || undefined);
    setNudgeModalTask(null);
    setNudgeMessage('');
  };

  const handleSendSos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosModalTask || !sosReason.trim()) return;
    dataStore.requestTaskHelp(sosModalTask.id, currentUser.name, sosDepartment, sosReason);
    setSosModalTask(null);
    setSosReason('');
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return { label: 'عاجل جداً', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'high':
        return { label: 'أولوية مرتفعة', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'medium':
        return { label: 'أولوية متوسطة', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'low':
      default:
        return { label: 'عادية', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'started':
        return { label: 'بدأ التنفيذ', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20' };
      case 'in_progress':
        return { label: 'قيد العمل', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'paused':
        return { label: 'متوقف مؤقتاً', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'pending_approval':
      case 'review':
        return { label: 'بانتظار الاعتماد', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'approved':
      case 'completed':
        return { label: 'معتمد ومكتمل', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'deferred':
        return { label: 'مؤجل / متابعة', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'new':
      case 'scheduled':
      case 'todo':
      default:
        return { label: 'مجدول اليوم', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Daily Command Center */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-950/50 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 end-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-xs border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>مركز العمليات الميداني اليومي — Daily Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              أهلاً بك، {currentUser.name}
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              نفّذ مهامك الميدانية لحظة بلحظة، سجّل أوقات العمل الفعلية، أرفق الفواتير والمستندات بضغطة واحدة، ولا تدع أي متابعة تضيع دون توثيق.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Scope Switcher */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/10 flex items-center">
              <button
                onClick={() => setFilterScope('my_tasks')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterScope === 'my_tasks'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                مهامي اليوم ({scopedTasks.filter(t => t.assigneeId === currentUser.id).length})
              </button>
              <button
                onClick={() => setFilterScope('all_team')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterScope === 'all_team'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                مهام الفريق ({tasks.length})
              </button>
            </div>

            <button
              onClick={onOpenNewTask}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء مهمة جديدة</span>
            </button>
          </div>
        </div>

        {/* Live Counters Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <span className="text-xs text-slate-400 block mb-1">إجمالي المهام اليوم</span>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              {searchedTasks.length}
            </div>
          </div>

          <div className="bg-emerald-500/10 rounded-2xl p-3.5 border border-emerald-500/20">
            <span className="text-xs text-emerald-300 block mb-1">جاري التنفيذ والمؤقت</span>
            <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
              {activeTasks.length}
            </div>
          </div>

          <div className="bg-rose-500/10 rounded-2xl p-3.5 border border-rose-500/20">
            <span className="text-xs text-rose-300 block mb-1">متأخر / يحتاج تدخلاً</span>
            <div className="text-2xl font-bold text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              {overdueTasks.length}
            </div>
          </div>

          <div className="bg-purple-500/10 rounded-2xl p-3.5 border border-purple-500/20">
            <span className="text-xs text-purple-300 block mb-1">بانتظار الاعتماد</span>
            <div className="text-2xl font-bold text-purple-400 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              {pendingApprovalTasks.length}
            </div>
          </div>

          <div className="bg-blue-500/10 rounded-2xl p-3.5 border border-blue-500/20 col-span-2 sm:col-span-1">
            <span className="text-xs text-blue-300 block mb-1">المنجز والمعتمد</span>
            <div className="text-2xl font-bold text-blue-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
              {completedTasks.length}
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Tabs & Search Filter */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الكل ({searchedTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            جاري التنفيذ ({activeTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 bg-rose-50/70 hover:bg-rose-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            المتأخر ({overdueTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'upcoming'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            المجدول اليوم ({upcomingTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('pending_approval')}
            className={`px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'pending_approval'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 bg-purple-50/70 hover:bg-purple-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            بانتظار الاعتماد ({pendingApprovalTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'completed'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 bg-blue-50/70 hover:bg-blue-100'
            }`}
          >
            المكتمل ({completedTasks.length})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث في المهمة، العميل، الموقع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/60 ps-9 pe-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Task Cards Grid */}
      {displayedTasks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <CheckSquare className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">لا توجد مهام تطابق الفلتر الحالي</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            جميع المهام في هذا التصنيف منجزة أو لم يتم إسناد أعمال جديدة بعد في هذا النطاق.
          </p>
          <button
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة مهمة جديدة الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {displayedTasks.map((task) => {
            const priorityInfo = getPriorityBadge(task.priority);
            const statusInfo = getStatusBadge(task.status);
            const isChecklistExpanded = expandedChecklistTaskId === task.id;
            const completedChecklistCount = task.checklist.filter((c) => c.completed).length;
            const totalChecklistCount = task.checklist.length;
            const progressPercent = totalChecklistCount > 0 
              ? Math.round((completedChecklistCount / totalChecklistCount) * 100)
              : task.status === 'completed' || task.status === 'approved' ? 100 : 0;

            const isOverdue = task.dueDate < todayStr && task.status !== 'completed' && task.status !== 'approved';
            const hasTaskChain = (task.taskChain && task.taskChain.length > 1) || task.parentTaskId || task.chainFollowUpTaskId;

            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                className={`bg-white rounded-2xl border transition-all duration-150 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  task.isTimerRunning
                    ? 'border-emerald-400 ring-2 ring-emerald-500/20 bg-linear-to-b from-emerald-50/20 to-white'
                    : isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Header & Details */}
                <div className="p-5 space-y-4">
                  {/* Top Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Priority */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${priorityInfo.bg}`}>
                        {priorityInfo.label}
                      </span>

                      {/* Task Type */}
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-indigo-500" />
                        {task.taskType || task.category || 'ميدانية'}
                      </span>

                      {/* Status */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Due Date & SLA */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                        {task.dueDate} {task.dueTime ? `(${task.dueTime})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div
                    className="cursor-pointer group/title"
                    onClick={() => setViewingDetailsTaskId(task.id)}
                    title="انقر لعرض تفاصيل المهمة الكاملة والمرفقات والنقاش"
                  >
                    <h3 className="font-bold text-base text-slate-900 group-hover/title:text-indigo-600 transition-colors flex items-center justify-between">
                      <span>{task.title}</span>
                      <span className="text-[11px] font-bold text-indigo-600 group-hover/title:underline">عرض التفاصيل</span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Client & Location Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                    {/* Client / Entity */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Building className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block">الجهة / العميل</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {task.clientName || 'مؤسسة الصادق التجارية'}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-slate-400 block">الموقع</span>
                          <span className="font-medium text-slate-700 truncate block">{task.location}</span>
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        title="فتح الموقع على خرائط Google"
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-indigo-600 shrink-0 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Progress & Checklist */}
                  {totalChecklistCount > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <button
                          onClick={() => setExpandedChecklistTaskId(isChecklistExpanded ? null : task.id)}
                          className="font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                          <span>قائمة خطوات التنفيذ ({completedChecklistCount}/{totalChecklistCount})</span>
                          {isChecklistExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                        <span className="text-[11px] font-bold text-indigo-600">{progressPercent}%</span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {/* Expanded Checklist */}
                      {isChecklistExpanded && (
                        <div className="mt-2.5 p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200/80 animate-in fade-in duration-150">
                          {task.checklist.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-start gap-2.5 text-xs cursor-pointer hover:bg-white/60 p-1 rounded-md transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => dataStore.toggleTaskChecklistItem(task.id, item.id)}
                                className="mt-0.5 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <span className={item.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>
                                {item.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Financial & Time Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                    {/* Execution Timer Display */}
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg flex items-center gap-1.5 font-bold ${
                        task.isTimerRunning 
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse ring-2 ring-emerald-500/20' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {task.timeSpentMinutes ? `${task.timeSpentMinutes} دقيقة` : 'لم يبدأ المؤقت'}
                        </span>
                      </div>

                      {/* Timer Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleTimer(task)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                          task.isTimerRunning
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        }`}
                      >
                        {task.isTimerRunning ? (
                          <>
                            <Pause className="w-3 h-3 fill-current" />
                            <span>إيقاف المؤقت</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>{task.timeSpentMinutes ? 'استئناف' : 'بدء التنفيذ'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Fund / Expense Overview */}
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-slate-400" />
                        <span>المصروف: {formatCurrency(task.spentAmount, settings.currency)}</span>
                      </span>

                      {hasTaskChain && (
                        <button
                          onClick={() => setSelectedTaskForChain(task)}
                          className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <GitCommit className="w-3 h-3" />
                          <span>سلسلة المتابعة</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action Bottom Toolbar */}
                <div className="px-5 py-3 bg-slate-50/90 border-t border-slate-100 rounded-b-2xl flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Record Outcome Button (Main Call to Action) */}
                    <button
                      type="button"
                      onClick={() => setSelectedTaskForOutcome(task)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>إنهاء وتسجيل النتيجة</span>
                    </button>

                    {/* Add Direct Expense Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedTaskForExpense(task)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1"
                      title="إضافة فاتورة / مصروف مرتبط بهذه المهمة"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">إضافة مصروف</span>
                    </button>

                    {/* View Full Details Button */}
                    <button
                      type="button"
                      onClick={() => setViewingDetailsTaskId(task.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs transition-colors flex items-center gap-1"
                      title="فتح التفاصيل الكاملة والمرفقات والنقاش"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>التفاصيل</span>
                    </button>
                  </div>

                  {/* Secondary Quick Triggers (Nudge, SOS, Proof) */}
                  <div className="flex items-center gap-1">
                    {/* SOS / Request Help */}
                    <button
                      type="button"
                      onClick={() => {
                        setSosModalTask(task);
                        setSosReason('');
                      }}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                      title="طلب مساعدة وتدخل إداري عاجل (SOS)"
                    >
                      <LifeBuoy className="w-4 h-4" />
                    </button>

                    {/* Nudge / Reminder */}
                    <button
                      type="button"
                      onClick={() => {
                        setNudgeModalTask(task);
                        setNudgeMessage('');
                      }}
                      className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors"
                      title="إرسال نكز وتنبيه فوري للمسؤول أو المنفذ"
                    >
                      <Bell className="w-4 h-4" />
                    </button>

                    {/* View Chain */}
                    {hasTaskChain && (
                      <button
                        type="button"
                        onClick={() => setSelectedTaskForChain(task)}
                        className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
                        title="عرض شجرة المتابعة المتسلسلة"
                      >
                        <GitCommit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Outcome Modal */}
      {selectedTaskForOutcome && (
        <TaskOutcomeModal
          task={selectedTaskForOutcome}
          isOpen={!!selectedTaskForOutcome}
          onClose={() => setSelectedTaskForOutcome(null)}
          onSuccess={() => {
            setTasks([...dataStore.getTasks()]);
            setSelectedTaskForOutcome(null);
          }}
        />
      )}

      {/* Task Chain Modal */}
      {selectedTaskForChain && (
        <TaskChainModal
          task={selectedTaskForChain}
          isOpen={!!selectedTaskForChain}
          onClose={() => setSelectedTaskForChain(null)}
        />
      )}

      {/* Quick Expense Modal */}
      {selectedTaskForExpense && (
        <NewExpenseModal
          isOpen={!!selectedTaskForExpense}
          onClose={() => setSelectedTaskForExpense(null)}
          initialTaskId={selectedTaskForExpense.id}
          initialFundId={selectedTaskForExpense.fundId}
        />
      )}

      {/* Nudge Modal */}
      {nudgeModalTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">إرسال نكز وتذكير فوري (Nudge)</h3>
                <p className="text-xs text-slate-500">للمهمة: {nudgeModalTask.title}</p>
              </div>
            </div>

            <form onSubmit={handleSendNudge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نص التنبيه الإداري
                </label>
                <textarea
                  rows={3}
                  value={nudgeMessage}
                  onChange={(e) => setNudgeMessage(e.target.value)}
                  placeholder="تذكير عاجل من الإدارة: نرجو سرعة تحديث حالة المهمة والتحقق من اشتراطات العميل..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNudgeModalTask(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                >
                  إرسال النكز فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOS / Request Help Modal */}
      {sosModalTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">طلب مساعدة وتدخل إداري (SOS)</h3>
                <p className="text-xs text-slate-500">{sosModalTask.title}</p>
              </div>
            </div>

            <form onSubmit={handleSendSos} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الجهة المطلوب تدخلها
                </label>
                <select
                  value={sosDepartment}
                  onChange={(e) => setSosDepartment(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800"
                >
                  <option value="الإدارة المالية والعهد">الإدارة المالية والعهد (تجاوز سقف أو تعزيز فوري)</option>
                  <option value="مدير العمليات">مدير العمليات (عائق فني أو تشغيلي في الموقع)</option>
                  <option value="إدارة العقود والعملاء">إدارة العقود والعملاء (خلاف مع المنشأة أو العميل)</option>
                  <option value="السلامة والصحة المهنية">السلامة والصحة المهنية (خطر أو تصريح عمل)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تفاصيل المشكلة والعائق في الميدان <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={sosReason}
                  onChange={(e) => setSosReason(e.target.value)}
                  placeholder="اشرح العائق المطلوب حله فوراً..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSosModalTask(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  إرسال نداء الاستغاثة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Task Details & Collaboration Modal */}
      {viewingDetailsTaskId && (
        <TaskDetailsModal
          taskId={viewingDetailsTaskId}
          isOpen={!!viewingDetailsTaskId}
          onClose={() => setViewingDetailsTaskId(null)}
          onOpenOutcomeModal={(task) => setSelectedTaskForOutcome(task)}
          onOpenNewExpense={(taskId) => {
            const t = tasks.find((x) => x.id === taskId) || null;
            setSelectedTaskForExpense(t);
          }}
          onOpenChainModal={(task) => setSelectedTaskForChain(task)}
        />
      )}
    </div>
  );
};
