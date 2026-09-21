import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  Calendar,
  Building,
  User as UserIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Trash2,
  Tag,
  Wallet,
} from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { TasksService } from '../../services/tasks.service';
import { Task, TaskPriority, TaskStatus } from '../../types/domain';
import { formatCurrency, formatDate, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '../../lib/utils/format';
import { hasPermission } from '../../lib/rbac/permissions';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { TaskDetailsModal } from '../modals/TaskDetailsModal';

interface TasksViewProps {
  onOpenNewTask: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onOpenNewTask }) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const currentUser = dataStore.getCurrentUser();
  const tasks = dataStore.getTasks();
  const canCreate = hasPermission(currentUser.role, 'tasks', 'create');
  const canEdit = hasPermission(currentUser.role, 'tasks', 'edit');
  const canDelete = hasPermission(currentUser.role, 'tasks', 'delete');

  const filteredTasks = TasksService.filter({
    status: statusFilter,
    priority: priorityFilter,
    search,
  });

  const kanbanColumns: { id: TaskStatus; label: string; bg: string }[] = [
    { id: 'todo', label: 'قيد الانتظار', bg: 'bg-slate-100/70 border-slate-200' },
    { id: 'in_progress', label: 'جاري التنفيذ', bg: 'bg-blue-50/70 border-blue-200' },
    { id: 'review', label: 'قيد المراجعة', bg: 'bg-amber-50/70 border-amber-200' },
    { id: 'completed', label: 'مكتملة بنجاح', bg: 'bg-emerald-50/70 border-emerald-200' },
  ];

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    TasksService.updateStatus(taskId, newStatus);
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

  const handleToggleChecklist = (taskId: string, itemId: string) => {
    TasksService.toggleChecklist(taskId, itemId);
    if (selectedTask && selectedTask.id === taskId) {
      const updatedChecklist = selectedTask.checklist.map((c) =>
        c.id === itemId ? { ...c, completed: !c.completed } : c
      );
      setSelectedTask({ ...selectedTask, checklist: updatedChecklist });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه المهمة نهائياً؟')) {
      TasksService.delete(taskId);
      setSelectedTask(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في أسماء المهام، المواقع، الوسوم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">كافة الحالات</option>
            <option value="todo">قيد الانتظار</option>
            <option value="in_progress">جاري التنفيذ</option>
            <option value="review">قيد المراجعة</option>
            <option value="completed">مكتملة</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">كافة الأولويات</option>
            <option value="urgent">حرجة وعاجلة</option>
            <option value="high">أولوية مرتفعة</option>
            <option value="medium">متوسطة</option>
            <option value="low">عادية</option>
          </select>
        </div>

        {/* View Mode Toggle & Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عرض كانبان"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">كانبان</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عرض جدول"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">جدول</span>
            </button>
          </div>

          {canCreate && (
            <Button
              variant="primary"
              size="md"
              onClick={onOpenNewTask}
              icon={<Plus className="w-4 h-4" />}
              className="text-xs sm:text-sm"
            >
              مهمة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverCol !== col.id) setDragOverCol(col.id);
                }}
                onDragLeave={() => {
                  if (dragOverCol === col.id) setDragOverCol(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  if (draggedTaskId) {
                    handleStatusChange(draggedTaskId, col.id);
                    setDraggedTaskId(null);
                  }
                }}
                className={`rounded-2xl border p-4 flex flex-col gap-3 min-h-[500px] transition-all duration-200 ${
                  dragOverCol === col.id ? 'ring-2 ring-indigo-500 bg-indigo-50/50 scale-[1.01]' : col.bg
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-800">{col.label}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-xs border border-slate-200">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => {
                    const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];
                    const completedChecklist = task.checklist.filter((c) => c.completed).length;
                    const isDragging = draggedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverCol(null);
                        }}
                        onClick={() => setSelectedTask(task)}
                        className={`bg-white rounded-xl p-4 border transition-all cursor-grab active:cursor-grabbing space-y-3 ${
                          isDragging
                            ? 'opacity-40 scale-95 border-dashed border-indigo-400'
                            : 'border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${priorityCfg.color}`}>
                            {priorityCfg.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDate(task.dueDate)}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug">
                          {task.title}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{task.location}</span>
                        </div>

                        {/* Checklist progress and Assignee */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                            <span>{completedChecklist}/{task.checklist.length}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                            {task.assigneeAvatar ? (
                              <img
                                src={task.assigneeAvatar}
                                alt={task.assigneeName}
                                className="w-5 h-5 rounded-full object-cover border border-slate-300"
                              />
                            ) : (
                              <UserIcon className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="truncate max-w-[100px]">{task.assigneeName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="h-36 rounded-xl border border-dashed border-slate-300/80 flex items-center justify-center text-xs text-slate-400">
                      لا توجد مهام في هذه المرحلة
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">عنوان المهمة</th>
                  <th className="p-4">الأولوية</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">المسؤول</th>
                  <th className="p-4">الموقع</th>
                  <th className="p-4">تاريخ التسليم</th>
                  <th className="p-4">الميزانية</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const statusCfg = TASK_STATUS_CONFIG[task.status];
                  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <td className="p-4 font-bold text-slate-900 max-w-xs">
                        <span className="line-clamp-1">{task.title}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[11px] px-2 py-0.5 rounded-md border font-bold ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full border font-bold ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-700">
                        {task.assigneeName}
                      </td>
                      <td className="p-4 text-slate-500">
                        {task.location}
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dir-ltr text-right">
                        {formatCurrency(task.budget)}
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                          className="text-xs text-indigo-600 font-bold"
                        >
                          معاينة
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Comprehensive Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          taskId={selectedTask.id}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};
