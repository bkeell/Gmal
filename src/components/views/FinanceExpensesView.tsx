import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Building,
  Eye,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { ExpensesService } from '../../services/expenses.service';
import { ReportsService } from '../../services/reports.service';
import { Expense, ExpenseStatus, ExpenseCategory } from '../../types/domain';
import { formatCurrency, EXPENSE_STATUS_CONFIG, EXPENSE_CATEGORY_CONFIG } from '../../lib/utils/format';
import { hasPermission } from '../../lib/rbac/permissions';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';

interface FinanceExpensesViewProps {
  onOpenNewExpense: () => void;
}

export const FinanceExpensesView: React.FC<FinanceExpensesViewProps> = ({ onOpenNewExpense }) => {
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [rejectExpense, setRejectExpense] = useState<Expense | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const currentUser = dataStore.getCurrentUser();
  const expenses = dataStore.getExpenses();
  const summary = ExpensesService.getSummary();

  const canApprove = hasPermission(currentUser.role, 'expenses', 'approve');
  const canCreate = hasPermission(currentUser.role, 'expenses', 'create');

  const filteredExpenses = expenses.filter((e) => {
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      e.description.toLowerCase().includes(q) ||
      e.vendorName.toLowerCase().includes(q) ||
      e.invoiceNumber.toLowerCase().includes(q) ||
      e.fundName.toLowerCase().includes(q);

    return matchesStatus && matchesCat && matchesSearch;
  });

  const handleApprove = (expId: string) => {
    ExpensesService.approve(expId);
    if (selectedExpense && selectedExpense.id === expId) {
      setSelectedExpense({ ...selectedExpense, status: 'approved' });
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectExpense || !rejectionReason.trim()) return;

    ExpensesService.reject(rejectExpense.id, rejectionReason);
    setRejectExpense(null);
    setRejectionReason('');
  };

  const handleExportCSV = () => {
    const csvData = ReportsService.exportExpensesToCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `مصروفات_العهد_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500">إجمالي المصروفات المسجلة</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(summary.totalAmount)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{summary.totalCount} فواتير ضريبية</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500">فواتير قيد التدقيق المالي</span>
          <h3 className="text-2xl font-black text-amber-600 mt-2">
            {formatCurrency(summary.pendingAmount)}
          </h3>
          <p className="text-xs text-amber-700 font-medium mt-1">
            {summary.pendingCount} مطالبات بانتظار الاعتماد
          </p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500">المصروفات المعتمدة والمقفلة</span>
          <h3 className="text-2xl font-black text-emerald-700 mt-2">
            {formatCurrency(summary.approvedAmount)}
          </h3>
          <p className="text-xs text-emerald-600 mt-1">تم التحقق من مطابقتها</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500">ضريبة القيمة المضافة (5%)</span>
          <h3 className="text-2xl font-black text-indigo-900 mt-2">
            {formatCurrency(expenses.reduce((s, e) => s + e.taxAmount, 0))}
          </h3>
          <p className="text-xs text-indigo-600 mt-1">قابلة للاسترداد الضريبي</p>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة، المورد، البيان، أو العهدة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">كافة الحالات</option>
            <option value="pending_approval">بانتظار الاعتماد</option>
            <option value="approved">معتمد للصرف</option>
            <option value="settled">تمت التسوية</option>
            <option value="rejected">مرفوض</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">كافة التصنيفات</option>
            {Object.entries(EXPENSE_CATEGORY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleExportCSV}
            icon={<Download className="w-4 h-4 text-slate-600" />}
            className="text-xs sm:text-sm"
          >
            تصدير CSV
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              size="md"
              onClick={onOpenNewExpense}
              icon={<Plus className="w-4 h-4" />}
              className="text-xs sm:text-sm"
            >
              + إضافة مصروف
            </Button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <Card className="border-slate-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-4">رقم الفاتورة</th>
                <th className="p-4">بيان المصروف</th>
                <th className="p-4">العهدة</th>
                <th className="p-4">التصنيف</th>
                <th className="p-4">المورد</th>
                <th className="p-4">المبلغ الأساسي</th>
                <th className="p-4">الضريبة 5%</th>
                <th className="p-4">الإجمالي</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => {
                const statusCfg = EXPENSE_STATUS_CONFIG[exp.status];
                const catCfg = EXPENSE_CATEGORY_CONFIG[exp.category] || { label: exp.category };

                return (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-indigo-700">
                      {exp.invoiceNumber}
                    </td>
                    <td className="p-4 font-medium text-slate-900 max-w-xs">
                      <p className="line-clamp-1">{exp.description}</p>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        رفع بواسطة: {exp.submittedBy} • {exp.submittedAt}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {exp.fundName}
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {catCfg.label}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-semibold">
                      {exp.vendorName}
                    </td>
                    <td className="p-4 font-medium text-slate-600 dir-ltr text-right">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="p-4 text-slate-500 dir-ltr text-right">
                      {formatCurrency(exp.taxAmount)}
                    </td>
                    <td className="p-4 font-black text-slate-900 dir-ltr text-right">
                      {formatCurrency(exp.totalWithTax)}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedExpense(exp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                          title="معاينة الفاتورة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canApprove && exp.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => handleApprove(exp.id)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                              title="اعتماد المصروف"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejectExpense(exp)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="رفض المصروف"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-xs sm:text-sm">
                    لا توجد فواتير أو مصروفات مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expense Details & Receipt Modal */}
      {selectedExpense && (
        <Modal
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          title="تفاصيل الفاتورة الضريبية"
          description={`رمز المصروف: ${selectedExpense.code}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block">رقم الفاتورة</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{selectedExpense.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">اسم المورد</span>
                <span className="font-bold text-slate-800 text-sm">{selectedExpense.vendorName}</span>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-400 block">الإجمالي شامل الضريبة</span>
                <span className="font-black text-indigo-950 text-base dir-ltr block">
                  {formatCurrency(selectedExpense.totalWithTax)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500">بيان الصرف:</span>
              <p className="text-xs sm:text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                {selectedExpense.description}
              </p>
            </div>

            {selectedExpense.rejectionReason && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> سبب الرفض المالي:
                </span>
                <p>{selectedExpense.rejectionReason}</p>
              </div>
            )}

            {/* Receipt Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500">المستند المرفق / الفاتورة:</span>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 h-48 flex items-center justify-center relative">
                {selectedExpense.receiptUrl ? (
                  <img
                    src={selectedExpense.receiptUrl}
                    alt="Receipt"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-xs">
                    <FileText className="w-8 h-8 mx-auto mb-1 text-slate-400" />
                    <span>تم توثيق الفاتورة ورقياً في ملف العهدة المالي</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {canApprove && selectedExpense.status === 'pending_approval' ? (
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleApprove(selectedExpense.id)}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    اعتماد الصرف
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setRejectExpense(selectedExpense);
                      setSelectedExpense(null);
                    }}
                    icon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    رفض
                  </Button>
                </div>
              ) : <div />}

              <Button variant="secondary" size="sm" onClick={() => setSelectedExpense(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Reason Modal */}
      {rejectExpense && (
        <Modal
          isOpen={!!rejectExpense}
          onClose={() => setRejectExpense(null)}
          title="رفض طلب صرف مصروف العهدة"
          description={`سيتم إعادة مبلغ ${formatCurrency(rejectExpense.totalWithTax)} إلى رصيد العهدة (${rejectExpense.fundName})`}
          maxWidth="md"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">سبب الرفض المالي *</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="مثال: تجاوز حد الصرف المسموح، عدم وضوح الختم الضريبي، أو ضرورة إصدار أمر شراء رسمي..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="md" type="button" onClick={() => setRejectExpense(null)}>
                إلغاء
              </Button>
              <Button variant="danger" size="md" type="submit">
                تأكيد الرفض واسترجاع المبلغ
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
