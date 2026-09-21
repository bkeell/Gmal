import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Clock,
  Building,
  CheckCircle2,
  Plus,
  Filter,
  User,
  Eye,
  Edit3,
  CalendarClock,
  ArrowRightLeft,
  Trash2,
  AlertCircle,
  MapPin,
  CheckSquare,
  X,
  Search,
  Sparkles,
  Layers,
  ArrowUpRight,
  Send,
} from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { Task, TaskPriority, TaskStatus, User as DomainUser } from '../../types/domain';
import { formatDate, formatCurrency, TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '../../lib/utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { TaskDetailsModal } from '../modals/TaskDetailsModal';

interface CalendarViewProps {
  onOpenNewTask: () => void;
  onSelectView: (view: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenNewTask, onSelectView }) => {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string>(now.toISOString().split('T')[0]);
  const [selectedOfficer, setSelectedOfficer] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [reschedulingTask, setReschedulingTask] = useState<Task | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickAddTargetDate, setQuickAddTargetDate] = useState<string>(selectedDay);

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Storage data subscription for live reactivity
  const [tasks, setTasks] = useState<Task[]>(() => dataStore.getTasks());
  const [settlements, setSettlements] = useState(() => dataStore.getSettlements());
  const users = dataStore.getUsers();

  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setTasks(dataStore.getTasks());
      setSettlements(dataStore.getSettlements());
    });
    return unsubscribe;
  }, []);

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // Filter tasks based on officer, status, and search
  const filteredTasks = tasks.filter((t) => {
    if (selectedOfficer !== 'all' && t.assigneeId !== selectedOfficer && t.assigneeName !== selectedOfficer) {
      return false;
    }
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchAssignee = t.assigneeName.toLowerCase().includes(q);
      const matchLocation = t.location.toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee && !matchLocation) return false;
    }
    return true;
  });

  // Calendar math
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthNum = currentMonth + 1;
  const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Generate days in current month
  const daysInMonth = Array.from({ length: totalDaysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${currentYear}-${monthStr}-${dayNum < 10 ? '0' + dayNum : dayNum}`;
    const dayTasks = filteredTasks.filter((t) => t.dueDate === dateStr);
    const daySettlements = settlements.filter((s) => s.periodEnd === dateStr);
    return {
      dayNum,
      dateStr,
      tasks: dayTasks,
      settlements: daySettlements,
      hasEvents: dayTasks.length > 0 || daySettlements.length > 0,
    };
  });

  // Active selected day info
  const selectedDayTasks = filteredTasks.filter((t) => t.dueDate === selectedDay);
  const selectedDaySettlements = settlements.filter((s) => s.periodEnd === selectedDay);

  // Month Statistics
  const monthTasks = filteredTasks.filter((t) => t.dueDate.startsWith(`${currentYear}-${monthStr}`));
  const monthCompleted = monthTasks.filter((t) => t.status === 'completed' || t.status === 'approved').length;
  const todayStr = now.toISOString().split('T')[0];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDay(todayStr);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.stopPropagation();
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDrop = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.dueDate === targetDateStr) {
      setDraggedTaskId(null);
      return;
    }

    dataStore.rescheduleTask(taskId, targetDateStr, `ترحيل سريع بالسحب والإفلات إلى ${targetDateStr}`);
    setSelectedDay(targetDateStr);
    setDraggedTaskId(null);
  };

  // Quick Postpone Preset
  const handleQuickPostpone = (task: Task, daysToAdd: number) => {
    const baseDate = new Date(task.dueDate || todayStr);
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const newDateStr = baseDate.toISOString().split('T')[0];
    const daysLabel = daysToAdd === 1 ? 'يوم واحد (للغد)' : daysToAdd === 7 ? 'أسبوع كامل' : `${daysToAdd} أيام`;

    dataStore.rescheduleTask(task.id, newDateStr, `ترحيل سريع لـ ${daysLabel}`);
    setReschedulingTask(null);
  };

  // Open Quick Add Modal for a specific date
  const handleOpenAddForDay = (dateStr: string) => {
    setQuickAddTargetDate(dateStr);
    setSelectedDay(dateStr);
    setIsQuickAddOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Action Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  التقويم التشغيلي وجدولة المهام الميدانية
                </h2>
                <Badge variant="purple" size="md">
                  {monthTasks.length} مهمة هذا الشهر
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                استعراض جدول الأعمال، إمكانية التعديل، الترحيل ليوم آخر بالسحب والإفلات، وإضافة مهام مباشرة لنفس اليوم.
              </p>
            </div>
          </div>

          {/* Quick Month Metrics */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 block font-bold">مهام اليوم</span>
              <span className="text-sm font-black text-slate-900">
                {tasks.filter((t) => t.dueDate === todayStr).length}
              </span>
            </div>

            <div className="px-3.5 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-emerald-700 block font-bold">أُنجزت بالشهر</span>
              <span className="text-sm font-black text-emerald-800">
                {monthCompleted}
              </span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenAddForDay(selectedDay)}
              icon={<Plus className="w-4 h-4" />}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 font-bold shadow-xs py-2.5"
            >
              + إضافة مهمة لليوم المحدد
            </Button>
          </div>
        </div>

        {/* Filters & Month Navigator Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Navigator */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition cursor-pointer"
                title="الشهر السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-black text-slate-900 min-w-[120px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition cursor-pointer"
                title="الشهر القادم"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Jump to Today Button */}
            <button
              type="button"
              onClick={handleGoToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              اليوم ({todayStr})
            </button>

            {/* Officer Filter */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">كافة المنفذين ({users.length})</option>
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.roleTitleAr || u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">كافة الحالات</option>
                <option value="scheduled">مجدولة</option>
                <option value="started">بدأ التنفيذ</option>
                <option value="in_progress">جاري التنفيذ</option>
                <option value="completed">مكتملة</option>
                <option value="deferred">مؤجلة / مرحلة</option>
              </select>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في المهام والمواقع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-3 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar Grid (Right/Left) + Selected Day Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          <Card className="p-4 sm:p-5">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-bold text-slate-500">
              <span className="py-1">الأحد</span>
              <span className="py-1">الاثنين</span>
              <span className="py-1">الثلاثاء</span>
              <span className="py-1">الأربعاء</span>
              <span className="py-1">الخميس</span>
              <span className="py-1">الجمعة</span>
              <span className="py-1">السبت</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Padding empty slots for the first day of week */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[85px] sm:min-h-[105px] p-1.5 rounded-2xl bg-slate-50/40 border border-slate-100/60 opacity-40"
                />
              ))}

              {daysInMonth.map((day) => {
                const isSelected = day.dateStr === selectedDay;
                const isToday = day.dateStr === todayStr;
                const isDragOver = dragOverDate === day.dateStr;

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedDay(day.dateStr)}
                    onDragOver={(e) => handleDragOver(e, day.dateStr)}
                    onDrop={(e) => handleDrop(e, day.dateStr)}
                    className={`group relative min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-2xl border text-right flex flex-col justify-between transition cursor-pointer select-none ${
                      isDragOver
                        ? 'border-indigo-600 bg-indigo-100/80 ring-2 ring-indigo-500 shadow-md scale-[1.02]'
                        : isSelected
                        ? 'border-indigo-600 bg-indigo-50/90 shadow-sm ring-2 ring-indigo-500/30'
                        : isToday
                        ? 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50'
                        : day.hasEvents
                        ? 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    {/* Day Top Bar */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black ${
                          isSelected
                            ? 'text-indigo-950 font-black'
                            : isToday
                            ? 'text-emerald-800'
                            : 'text-slate-800'
                        }`}
                      >
                        {day.dayNum}
                        {isToday && (
                          <span className="text-[9px] mr-1 font-bold text-emerald-600">اليوم</span>
                        )}
                      </span>

                      {/* Quick Add Button on Day Hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddForDay(day.dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition shadow-xs"
                        title={`إضافة مهمة في تاريخ ${day.dateStr}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Day Task Previews */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {day.tasks.slice(0, 2).map((t) => {
                        const prio = TASK_PRIORITY_CONFIG[t.priority] || TASK_PRIORITY_CONFIG.medium;
                        const isCompleted = t.status === 'completed' || t.status === 'approved';

                        return (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, t.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDay(day.dateStr);
                              setViewingTaskId(t.id);
                            }}
                            className={`text-[10px] leading-tight truncate px-1.5 py-0.5 rounded-md font-semibold border flex items-center gap-1 transition-all cursor-grab active:cursor-grabbing hover:opacity-90 ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 line-through'
                                : t.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-800 border-rose-200 font-bold'
                                : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                            }`}
                            title={`اسحب المهمة لترحيلها ليوم آخر: ${t.title} (${t.assigneeName})`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${prio.dotColor}`} />
                            <span className="truncate">{t.title}</span>
                          </div>
                        );
                      })}

                      {day.tasks.length > 2 && (
                        <span className="text-[9px] text-indigo-600 font-black block pt-0.5">
                          +{day.tasks.length - 2} مهام أخرى
                        </span>
                      )}

                      {/* Settlement Indicator if any */}
                      {day.settlements.length > 0 && (
                        <div className="text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-bold truncate">
                          تصفية عهدة ({day.settlements.length})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Helpful Legend / Drag Instructions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>حرجة</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 mr-2" />
                <span>مرتفعة</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-2" />
                <span>متوسطة</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
                <span>مكتملة</span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>ملاحظة: يمكنك سحب أي مهمة وإفلاتها على يوم آخر لترحيلها وتغيير موعدها فوراً.</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Selected Day Agenda & Action Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">
                    جدول اليوم والمهام المحددة
                  </span>
                  <CardTitle className="text-base font-black text-slate-900">
                    {formatDate(selectedDay)}
                  </CardTitle>
                </div>
                <Badge variant={selectedDayTasks.length > 0 ? 'purple' : 'default'} size="sm">
                  {selectedDayTasks.length} مهام
                </Badge>
              </div>

              {/* Add Task Directly for This Selected Day Button */}
              <div className="pt-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenAddForDay(selectedDay)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                  className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 font-bold py-2 shadow-xs"
                >
                  + إضافة مهمة جديدة لهذا اليوم
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5 max-h-[620px] overflow-y-auto">
              {/* Financial Settlement notices for selected day */}
              {selectedDaySettlements.length > 0 && (
                <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      إقفال وتسوية عهدة مطلوبة
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectView('settlements')}
                      className="text-[11px] text-amber-700 underline font-bold hover:text-amber-900"
                    >
                      فتح التسويات
                    </button>
                  </div>
                  {selectedDaySettlements.map((set) => (
                    <div key={set.id} className="text-xs text-amber-800 flex justify-between pt-1">
                      <span>{set.fundName}</span>
                      <span className="font-mono font-bold">{formatCurrency(set.totalExpenses)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks List */}
              {selectedDayTasks.length > 0 ? (
                selectedDayTasks.map((task) => {
                  const prio = TASK_PRIORITY_CONFIG[task.priority] || TASK_PRIORITY_CONFIG.medium;
                  const statusConf = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.todo;
                  const isDone = task.status === 'completed' || task.status === 'approved';

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2.5 group ${
                        isDone
                          ? 'bg-slate-50/80 border-slate-200 opacity-80'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Status and Priority */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${prio.color}`}>
                            {prio.label}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${statusConf.bg} ${statusConf.color}`}>
                            {statusConf.label}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          {task.id}
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        onClick={() => setViewingTaskId(task.id)}
                        className={`font-bold text-sm leading-snug cursor-pointer transition-colors ${
                          isDone
                            ? 'line-through text-slate-500'
                            : 'text-slate-900 group-hover:text-indigo-600'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Assignee & Location */}
                      <div className="space-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>المكلف: <strong>{task.assigneeName}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{task.location} {task.clientName ? `(${task.clientName})` : ''}</span>
                        </div>
                      </div>

                      {/* Action Bar (Edit, Reschedule/Postpone, Details) */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          {/* Quick Edit Button */}
                          <button
                            type="button"
                            onClick={() => setEditingTask(task)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                            title="تعديل بيانات المهمة"
                          >
                            <Edit3 className="w-3 h-3 text-slate-600" />
                            <span>تعديل</span>
                          </button>

                          {/* Reschedule Button */}
                          <button
                            type="button"
                            onClick={() => setReschedulingTask(task)}
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex items-center gap-1"
                            title="ترحيل المهمة ليوم آخر"
                          >
                            <CalendarClock className="w-3 h-3 text-amber-600" />
                            <span>ترحيل</span>
                          </button>
                        </div>

                        {/* Full Details Modal trigger */}
                        <button
                          type="button"
                          onClick={() => setViewingTaskId(task.id)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5"
                        >
                          <Eye className="w-3 h-3" />
                          <span>التفاصيل</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700">
                      لا توجد مهام مسجلة في هذا اليوم
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      يمكنك جدولة مهمة جديدة فوراً بالنقر أدناه.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAddForDay(selectedDay)}
                    className="text-xs border-indigo-200 text-indigo-700 font-bold"
                  >
                    + إضافة مهمة لليوم ({selectedDay})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 1. QUICK ADD TASK MODAL FOR SPECIFIC DAY                          */}
      {/* ================================================================= */}
      {isQuickAddOpen && (
        <QuickAddDayTaskModal
          isOpen={isQuickAddOpen}
          targetDate={quickAddTargetDate}
          users={users}
          onClose={() => setIsQuickAddOpen(false)}
          onSuccess={(newTask) => {
            setIsQuickAddOpen(false);
            setSelectedDay(newTask.dueDate);
          }}
        />
      )}

      {/* ================================================================= */}
      {/* 2. QUICK EDIT TASK MODAL                                          */}
      {/* ================================================================= */}
      {editingTask && (
        <QuickEditTaskModal
          task={editingTask}
          users={users}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={() => setEditingTask(null)}
        />
      )}

      {/* ================================================================= */}
      {/* 3. RESCHEDULE / POSTPONE MODAL (ترحيل المهمة ليوم آخر)             */}
      {/* ================================================================= */}
      {reschedulingTask && (
        <RescheduleTaskModal
          task={reschedulingTask}
          isOpen={!!reschedulingTask}
          onClose={() => setReschedulingTask(null)}
          onReschedule={(newDate, reason) => {
            dataStore.rescheduleTask(reschedulingTask.id, newDate, reason);
            setSelectedDay(newDate);
            setReschedulingTask(null);
          }}
          onQuickPreset={(days) => handleQuickPostpone(reschedulingTask, days)}
        />
      )}

      {/* ================================================================= */}
      {/* 4. FULL TASK DETAILS MODAL (مرفقات، نقاش، تدقيق)                  */}
      {/* ================================================================= */}
      {viewingTaskId && (
        <TaskDetailsModal
          taskId={viewingTaskId}
          isOpen={!!viewingTaskId}
          onClose={() => setViewingTaskId(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: QuickAddDayTaskModal
// ============================================================================
interface QuickAddDayTaskModalProps {
  isOpen: boolean;
  targetDate: string;
  users: DomainUser[];
  onClose: () => void;
  onSuccess: (newTask: Task) => void;
}

const QuickAddDayTaskModal: React.FC<QuickAddDayTaskModalProps> = ({
  isOpen,
  targetDate,
  users,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(targetDate);
  const [assigneeId, setAssigneeId] = useState(users[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [location, setLocation] = useState('');
  const [clientName, setClientName] = useState('');
  const [budget, setBudget] = useState('1000');
  const [taskType, setTaskType] = useState('زيارة ميدانية');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) {
      alert('يرجى كتابة عنوان المهمة والموقع الجغرافي');
      return;
    }

    const assignedUser = users.find((u) => u.id === assigneeId) || users[0];

    const newTask = dataStore.addTask({
      title,
      description,
      status: 'scheduled',
      priority,
      taskType,
      category: taskType || 'تشغيل وصيانة',
      startDate: dueDate,
      dueDate,
      assigneeId: assignedUser.id,
      assigneeName: assignedUser.name,
      location,
      clientName: clientName || undefined,
      budget: Number(budget) || 0,
      tags: ['ميداني', taskType],
      checklist: [
        { id: '1', text: 'الوصول للموقع وتأكيد الحضور', completed: false },
        { id: '2', text: 'تنفيذ واستكمال المتطلبات الفنية', completed: false },
        { id: '3', text: 'توثيق الإثبات وتوقيع العميل', completed: false },
      ],
    });

    onSuccess(newTask);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`إضافة مهمة جديدة ليوم (${targetDate})`}
      description="جدولة مهمة ميدانية مباشرة وتكليف منفذ لها في هذا التاريخ المحدد."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            عنوان المهمة الميدانية <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="مثال: فحص ومعاينة الموقع / تسليم شحنة / زيارة متابعة"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              تاريخ المهمة <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">الموظف المكلف</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.roleTitleAr || u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              الموقع الجغرافي <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: دبي - القوز الصناعية"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم العميل / الجهة</label>
            <input
              type="text"
              placeholder="مثال: شركة التطوير العقاري"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">مستوى الأولوية</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold"
            >
              <option value="urgent">حرجة / عاجلة</option>
              <option value="high">مرتفعة</option>
              <option value="medium">متوسطة</option>
              <option value="low">عادية</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">نوع المهمة</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="زيارة ميدانية">زيارة ميدانية</option>
              <option value="تحصيل ومتابعة">تحصيل ومتابعة</option>
              <option value="صيانة وتشغيل">صيانة وتشغيل</option>
              <option value="فحص ومطابقة">فحص ومطابقة</option>
              <option value="توصيل وتسليم">توصيل وتسليم</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">الميزانية المرصودة (درهم)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">وصف وتوجيهات المهمة</label>
          <textarea
            rows={2}
            placeholder="تعليمات خاصة للفريق الميداني..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 font-bold"
          >
            تأكيد وجدولة المهمة
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================================
// SUB-COMPONENT: QuickEditTaskModal
// ============================================================================
interface QuickEditTaskModalProps {
  task: Task;
  users: DomainUser[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QuickEditTaskModal: React.FC<QuickEditTaskModalProps> = ({
  task,
  users,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [location, setLocation] = useState(task.location);
  const [clientName, setClientName] = useState(task.clientName || '');
  const [budget, setBudget] = useState(task.budget.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedUser = users.find((u) => u.id === assigneeId);

    dataStore.updateTaskDetails(task.id, {
      title,
      description,
      dueDate,
      startDate: dueDate,
      priority,
      status,
      location,
      clientName: clientName || undefined,
      budget: Number(budget) || 0,
      ...(assignedUser
        ? { assigneeId: assignedUser.id, assigneeName: assignedUser.name }
        : {}),
    });

    onSuccess();
  };

  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف المهمة "${task.title}" نهائياً؟`)) {
      dataStore.deleteTask(task.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`تعديل بيانات المهمة (${task.id})`}
      description="تحديث تفاصيل المهمة والمسؤول المكلف وتاريخ الإنجاز."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">عنوان المهمة</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">تاريخ التنفيذ</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">الموظف المكلف</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.roleTitleAr || u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">حالة المهمة</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold"
            >
              <option value="scheduled">مجدولة</option>
              <option value="started">بدأ التنفيذ</option>
              <option value="in_progress">جاري التنفيذ</option>
              <option value="review">قيد المراجعة</option>
              <option value="completed">مكتملة</option>
              <option value="deferred">مؤجلة / مرحلة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">الأولوية</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold"
            >
              <option value="urgent">حرجة / عاجلة</option>
              <option value="high">مرتفعة</option>
              <option value="medium">متوسطة</option>
              <option value="low">عادية</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">الموقع الجغرافي</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم العميل</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">الوصف والملاحظات</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="danger"
            size="sm"
            type="button"
            onClick={handleDelete}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            حذف المهمة
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 font-bold"
            >
              حفظ التعديلات
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================================
// SUB-COMPONENT: RescheduleTaskModal (ترحيل المهمة ليوم آخر)
// ============================================================================
interface RescheduleTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (newDate: string, reason: string) => void;
  onQuickPreset: (days: number) => void;
}

const RescheduleTaskModal: React.FC<RescheduleTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onReschedule,
  onQuickPreset,
}) => {
  const [newDate, setNewDate] = useState(() => {
    // Default to tomorrow
    const d = new Date(task.dueDate || new Date().toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState('تأجيل بالاتفاق مع العميل');

  const commonReasons = [
    'تأجيل بالاتفاق مع العميل',
    'سوء الأحوال الجوية / الموقع مغلق',
    'انشغال الفريق بمهام طارئة',
    'نقص مواد أو مستندات فنية',
    'إعادة جدولة روتينية',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      alert('يرجى اختيار التاريخ الجديد للترحيل');
      return;
    }
    onReschedule(newDate, reason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ترحيل المهمة ليوم آخر (Reschedule Task)"
      description={`المهمة الحالية: "${task.title}" - التاريخ الحالي: ${task.dueDate}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Quick 1-Click Presets */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700">خيارات ترحيل سريعة:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onQuickPreset(1)}
              className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-center transition cursor-pointer"
            >
              ترحيل للغد (+1 يوم)
            </button>
            <button
              type="button"
              onClick={() => onQuickPreset(3)}
              className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-center transition cursor-pointer"
            >
              بعد 3 أيام (+3)
            </button>
            <button
              type="button"
              onClick={() => onQuickPreset(7)}
              className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-center transition cursor-pointer"
            >
              الأسبوع القادم (+7)
            </button>
          </div>
        </div>

        {/* Custom Date Input */}
        <div className="space-y-1">
          <label className="block font-bold text-slate-700">أو اختر تاريخاً مخصصاً:</label>
          <input
            type="date"
            required
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800"
          />
        </div>

        {/* Reason for Reschedule */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700">سبب الترحيل (للتوثيق والرقابة):</label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: طلب العميل إعادة الزيارة الأسبوع القادم"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-medium"
          />

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {commonReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`text-[10px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                  reason === r
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            icon={<CalendarClock className="w-3.5 h-3.5" />}
            className="bg-amber-600 hover:bg-amber-700 font-bold text-white"
          >
            تأكيد ترحيل المهمة
          </Button>
        </div>
      </form>
    </Modal>
  );
};
