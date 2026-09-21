import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  FileCheck2,
  Receipt,
  CheckSquare,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  CheckCheck,
  ArrowRight,
  DollarSign,
  User,
  Paperclip,
  ExternalLink,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { Task, Expense, Settlement } from '../../types/domain';
import { formatCurrency, TASK_PRIORITY_CONFIG } from '../../lib/utils/format';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TaskDetailsModal } from '../modals/TaskDetailsModal';

interface ApprovalsViewProps {
  onSelectView?: (view: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({ onSelectView }) => {
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'expenses' | 'settlements'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);

  const currentUser = dataStore.getCurrentUser();
  const tasks = dataStore.getTasks();
  const expenses = dataStore.getExpenses();
  const settlements = dataStore.getSettlements();

  const pendingTasks = tasks.filter((t) => t.status === 'pending_approval');
  const pendingExpenses = expenses.filter((e) => e.status === 'pending_approval');
  const pendingSettlements = settlements.filter((s) => s.status === 'under_review');

  const totalPendingExpensesAmount = pendingExpenses.reduce((sum, e) => sum + e.totalWithTax, 0);

  // Filter lists based on search
  const filteredTasks = pendingTasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.assigneeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenses = pendingExpenses.filter((e) =>
    e.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.fundName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSettlements = pendingSettlements.filter((s) =>
    s.fundName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.holderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleTaskSelect = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleExpenseSelect = (id: string) => {
    setSelectedExpenseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllTasks = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  const handleSelectAllExpenses = () => {
    if (selectedExpenseIds.length === filteredExpenses.length) {
      setSelectedExpenseIds([]);
    } else {
      setSelectedExpenseIds(filteredExpenses.map((e) => e.id));
    }
  };

  const handleBulkApprove = () => {
    if (selectedTaskIds.length === 0 && selectedExpenseIds.length === 0) return;
    if (window.confirm(`هل أنت متأكد من اعتماد ${selectedTaskIds.length} مهمة و ${selectedExpenseIds.length} مصروف جماعياً؟`)) {
      if (selectedTaskIds.length > 0) dataStore.bulkApproveTasks(selectedTaskIds);
      if (selectedExpenseIds.length > 0) dataStore.bulkApproveExpenses(selectedExpenseIds);
      setSelectedTaskIds([]);
      setSelectedExpenseIds([]);
    }
  };

  const handleApproveTask = (taskId: string) => {
    const notes = window.prompt('ملاحظات الاعتماد (اختياري):', 'تمت مراجعة النتيجة وتأكيد صحتها');
    if (notes !== null) {
      dataStore.approveTask(taskId, notes);
    }
  };

  const handleRejectTask = (taskId: string) => {
    const reason = window.prompt('سبب رفض إنجاز المهمة:');
    if (reason) {
      dataStore.rejectTask(taskId, reason);
    }
  };

  const handleReworkTask = (taskId: string) => {
    const instructions = window.prompt('توجيهات الاستكمال والتعديل للموظف:');
    if (instructions) {
      dataStore.sendTaskForRework(taskId, instructions);
    }
  };

  const handleApproveExpense = (expenseId: string) => {
    dataStore.updateExpenseStatus(expenseId, 'approved');
  };

  const handleRejectExpense = (expenseId: string) => {
    const reason = window.prompt('سبب رفض الفاتورة:');
    if (reason) {
      dataStore.updateExpenseStatus(expenseId, 'rejected', reason);
    }
  };

  const handleApproveSettlement = (settlementId: string) => {
    if (window.confirm('هل تريد تأكيد اعتماد التسوية وإقفال المطابقة المحاسبية؟')) {
      dataStore.approveSettlement(settlementId, 'معتمدة ومطابقة بالكامل');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header & KPIs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              مركز الاعتمادات والرقابة الإشرافية
            </h2>
            <Badge variant="purple" size="md">
              {pendingTasks.length + pendingExpenses.length + pendingSettlements.length} طلبات معلقة
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مراجعة واعتماد إنجاز المهام الميدانية، فواتير المصروفات، وإقفال عهد الموظفين.
          </p>
        </div>

        {/* Bulk approve button if any items selected */}
        {(selectedTaskIds.length > 0 || selectedExpenseIds.length > 0) && (
          <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkApprove}
              icon={<CheckCheck className="w-4 h-4" />}
              className="bg-purple-600 hover:bg-purple-700 font-bold"
            >
              اعتماد المحدد ({selectedTaskIds.length + selectedExpenseIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">إجمالي بانتظار الاعتماد</span>
            <span className="text-lg font-black text-slate-900">
              {pendingTasks.length + pendingExpenses.length + pendingSettlements.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">مهام ميدانية مكتملة</span>
            <span className="text-lg font-black text-blue-700">
              {pendingTasks.length} مهمة
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">فواتير ومصروفات معلقة</span>
            <span className="text-lg font-black text-emerald-800">
              {formatCurrency(totalPendingExpensesAmount)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">تسويات عهد جارية</span>
            <span className="text-lg font-black text-amber-800">
              {pendingSettlements.length} تسويات
            </span>
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
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({pendingTasks.length + pendingExpenses.length + pendingSettlements.length})
          </button>
          <button
            onClick={() => setFilterType('tasks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'tasks'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            مهام بانتظار الاعتماد ({pendingTasks.length})
          </button>
          <button
            onClick={() => setFilterType('expenses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'expenses'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            فواتير ومصروفات ({pendingExpenses.length})
          </button>
          <button
            onClick={() => setFilterType('settlements')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'settlements'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            تسويات العهد ({pendingSettlements.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث في الطلبات والموظفين..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-3 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* SECTION 1: TASKS PENDING APPROVAL */}
      {(filterType === 'all' || filterType === 'tasks') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                المهام الميدانية المسلمة بانتظار الاعتماد ({filteredTasks.length})
              </h3>
            </div>

            {filteredTasks.length > 0 && (
              <button
                onClick={handleSelectAllTasks}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {selectedTaskIds.length === filteredTasks.length ? 'إلغاء تحديد الكل' : 'تحديد كل المهام'}
              </button>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="text-xs sm:text-sm font-bold text-slate-700">لا توجد مهام معلقة بانتظار الاعتماد</p>
              <p className="text-[11px] text-slate-400 mt-0.5">كافة المهام المسلمة تمت مراجعتها واعتمادها بنجاح.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((t) => {
                const priorityConfig = TASK_PRIORITY_CONFIG[t.priority] || TASK_PRIORITY_CONFIG.medium;
                const isSelected = selectedTaskIds.includes(t.id);

                return (
                  <div
                    key={t.id}
                    className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                      isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleTaskSelect(t.id)}
                        className="mt-1 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {t.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityConfig.color} bg-slate-100`}>
                            {priorityConfig.label}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            <span>المنفذ: <strong>{t.assigneeName}</strong></span>
                          </span>
                          <span className="text-xs text-slate-400">• {t.location}</span>
                        </div>

                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                          {t.title}
                        </h4>

                        {/* Outcome Details */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            <strong>النتيجة:</strong> {t.outcome === 'completed' ? 'تم الإنجاز بالكامل' : 'إنجاز جزئي / معوقات'}
                          </span>
                          {t.timeSpentMinutes && (
                            <span>
                              <strong>الوقت الفعلي:</strong> {t.timeSpentMinutes} دقيقة
                            </span>
                          )}
                          {t.proofRequired && (
                            <span className="text-indigo-700 font-bold">
                              <strong>الإثبات:</strong> {t.proofRequired}
                            </span>
                          )}
                          {t.attachments && t.attachments.length > 0 && (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              <span>{t.attachments.length} مرفقات</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      <button
                        onClick={() => setViewingTaskId(t.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>معاينة الإثباتات</span>
                      </button>

                      <button
                        onClick={() => handleReworkTask(t.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>طلب تعديل</span>
                      </button>

                      <button
                        onClick={() => handleRejectTask(t.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveTask(t.id)}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                      >
                        اعتماد النتيجة
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: EXPENSES PENDING APPROVAL */}
      {(filterType === 'all' || filterType === 'expenses') && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                فواتير ومصروفات بانتظار الاعتماد المالي ({filteredExpenses.length})
              </h3>
            </div>

            {filteredExpenses.length > 0 && (
              <button
                onClick={handleSelectAllExpenses}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {selectedExpenseIds.length === filteredExpenses.length ? 'إلغاء تحديد الكل' : 'تحديد كل الفواتير'}
              </button>
            )}
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="text-xs sm:text-sm font-bold text-slate-700">لا توجد فواتير معلقة بانتظار الاعتماد</p>
              <p className="text-[11px] text-slate-400 mt-0.5">كافة مطالبات المصروفات تم تدقيقها والموافقة عليها.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((e) => {
                const isSelected = selectedExpenseIds.includes(e.id);

                return (
                  <div
                    key={e.id}
                    className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                      isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleExpenseSelect(e.id)}
                        className="mt-1 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {e.code}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {e.vendorName}
                          </span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                            {e.category}
                          </span>
                          <span className="text-xs text-slate-400">• بواسطة {e.submittedBy}</span>
                          <span className="text-xs text-slate-400">• عهدة: {e.fundName}</span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 font-medium">
                          {e.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                          <span>فاتورة رقم: <strong>{e.invoiceNumber}</strong></span>
                          <span>الضريبة: {formatCurrency(e.taxAmount)}</span>
                          {e.receiptUrl && (
                            <a
                              href={e.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1 font-bold"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>معاينة الإيصال</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      <div className="text-right lg:text-left">
                        <span className="text-base sm:text-lg font-black text-emerald-700 block">
                          {formatCurrency(e.totalWithTax)}
                        </span>
                        <span className="text-[10px] text-slate-400">{e.submittedAt}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectExpense(e.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
                        >
                          رفض
                        </button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveExpense(e.id)}
                          icon={<CheckCircle2 className="w-4 h-4" />}
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                        >
                          اعتماد الصرف
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: SETTLEMENTS UNDER REVIEW */}
      {(filterType === 'all' || filterType === 'settlements') && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              تسويات العهد وإقفال الحسابات الجارية ({filteredSettlements.length})
            </h3>
          </div>

          {filteredSettlements.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="text-xs sm:text-sm font-bold text-slate-700">لا توجد تسويات عهد معلقة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSettlements.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {s.code}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">
                        {s.fundName}
                      </span>
                      <span className="text-xs text-slate-500">
                        • أمين العهدة: <strong>{s.holderName}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                      <span>الفترة: {s.periodStart} إلى {s.periodEnd}</span>
                      <span>سلفة العهدة: {formatCurrency(s.advanceAmount)}</span>
                      <span className="text-emerald-700 font-bold">المصروفات: {formatCurrency(s.totalExpenses)} ({s.expensesCount} فاتورة)</span>
                      <span className="text-blue-700 font-bold">المتبقي المرتجع: {formatCurrency(s.remainingAmount)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApproveSettlement(s.id)}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      className="bg-amber-600 hover:bg-amber-700 text-xs font-bold"
                    >
                      اعتماد التسوية وإقفال العهدة
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Details Modal Integration */}
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
