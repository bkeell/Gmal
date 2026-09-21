import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  AlertTriangle,
  History,
  User,
  Building,
  CheckCircle2,
  Receipt,
  Calendar,
  Layers,
} from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { FundsService } from '../../services/funds.service';
import { PettyCashFund } from '../../types/domain';
import { formatCurrency, formatDate, FUND_STATUS_CONFIG } from '../../lib/utils/format';
import { hasPermission } from '../../lib/rbac/permissions';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { NewFundModal } from '../modals/NewFundModal';

export const FinanceFundsView: React.FC = () => {
  const [isNewFundOpen, setIsNewFundOpen] = useState(false);
  const [replenishFund, setReplenishFund] = useState<PettyCashFund | null>(null);
  const [replenishAmount, setReplenishAmount] = useState('5000');
  const [replenishNotes, setReplenishNotes] = useState('إعادة تغذية دورية بناء على طلب المشرف الميداني');
  const [viewHistoryFund, setViewHistoryFund] = useState<PettyCashFund | null>(null);

  const currentUser = dataStore.getCurrentUser();
  const funds = dataStore.getFunds();
  const expenses = dataStore.getExpenses();
  const summary = FundsService.getSummary();

  const canCreate = hasPermission(currentUser.role, 'funds', 'create');
  const canApprove = hasPermission(currentUser.role, 'funds', 'approve');

  const handleReplenishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replenishFund) return;
    const amt = parseFloat(replenishAmount);
    if (isNaN(amt) || amt <= 0) return;

    FundsService.replenish(replenishFund.id, amt, replenishNotes);
    setReplenishFund(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500">إجمالي المخصص للعهد</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(summary.totalAllocated)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{summary.count} صناديق عهدة معتمدة</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500">السيولة النقدية المتاحة</span>
          <h3 className="text-2xl font-black text-emerald-700 mt-2">
            {formatCurrency(summary.totalCurrentBalance)}
          </h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {Math.round((summary.totalCurrentBalance / (summary.totalAllocated || 1)) * 100)}% رصيد متاح حالياً
          </p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500">إجمالي المصروفات المنفذة</span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(summary.totalSpent)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">تم توثيقها بفواتير ضريبية</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500">تنبيهات انخفاض الرصيد</span>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="text-2xl font-black text-amber-600">{summary.warningCount}</h3>
            {summary.warningCount > 0 ? (
              <Badge variant="warning" size="sm">
                بحاجة لتسوية
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                السيولة مستقرة
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">وصلت للحد الأدنى المسموح</p>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="font-bold text-base text-slate-900">سجل صناديق العهد الميدانية</h3>
          <p className="text-xs text-slate-500">تتبع الأرصدة الحالية، نسب الاستهلاك، وسندات الصرف</p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewFundOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            className="text-xs sm:text-sm"
          >
            تخصيص عهدة جديدة
          </Button>
        )}
      </div>

      {/* Funds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {funds.map((fund) => {
          const percent = Math.round((fund.currentBalance / fund.totalAllocation) * 100);
          const statusCfg = FUND_STATUS_CONFIG[fund.status];
          const isWarning = percent <= fund.warningThreshold;
          const fundExpenses = expenses.filter((e) => e.fundId === fund.id);

          return (
            <Card key={fund.id} hover className="border-slate-200/90 shadow-xs">
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {fund.code}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-slate-900">{fund.name}</h4>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>

                {/* Balance Display */}
                <div className="grid grid-cols-3 gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">التخصيص الأصلي</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dir-ltr block">
                      {formatCurrency(fund.totalAllocation, fund.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">الرصيد المتاح</span>
                    <span className="font-black text-xs sm:text-sm text-emerald-700 dir-ltr block">
                      {formatCurrency(fund.currentBalance, fund.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">المنصرف الفعلي</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-700 dir-ltr block">
                      {formatCurrency(fund.spentBalance, fund.currency)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className={isWarning ? 'text-rose-600' : 'text-slate-600'}>
                      المتبقي: {percent}%
                    </span>
                    <span className="text-slate-400">
                      حد التنبيه: {fund.warningThreshold}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        percent <= 20
                          ? 'bg-rose-500'
                          : percent <= 40
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      أمين العهدة: <strong className="text-slate-700 font-semibold">{fund.holderName}</strong>
                    </span>
                    <span>آخر تغذية: {formatDate(fund.lastReplenishedDate)}</span>
                  </div>
                  {fund.purpose && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                      الغرض: {fund.purpose}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewHistoryFund(fund)}
                    className="text-xs text-slate-600"
                    icon={<Receipt className="w-3.5 h-3.5" />}
                  >
                    الفواتير ({fundExpenses.length})
                  </Button>

                  {canApprove && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReplenishFund(fund)}
                      icon={<ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />}
                      className="text-xs border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                    >
                      تغذية الرصيد
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Replenish Fund Modal */}
      {replenishFund && (
        <Modal
          isOpen={!!replenishFund}
          onClose={() => setReplenishFund(null)}
          title="إعادة تغذية رصيد العهدة"
          description={`إضافة رصيد مالي جديد إلى: ${replenishFund.name} (${replenishFund.code})`}
          maxWidth="md"
        >
          <form onSubmit={handleReplenishSubmit} className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between">
              <span>الرصيد الحالي: <strong className="text-slate-800">{formatCurrency(replenishFund.currentBalance, replenishFund.currency)}</strong></span>
              <span>المخصص الإجمالي: <strong className="text-slate-800">{formatCurrency(replenishFund.totalAllocation, replenishFund.currency)}</strong></span>
            </div>

            <Input
              type="number"
              label="مبلغ التغذية (درهم) *"
              value={replenishAmount}
              onChange={(e) => setReplenishAmount(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">ملاحظات وسند التغذية</label>
              <textarea
                rows={2}
                value={replenishNotes}
                onChange={(e) => setReplenishNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="md" type="button" onClick={() => setReplenishFund(null)}>
                إلغاء
              </Button>
              <Button variant="success" size="md" type="submit">
                تأكيد الإيداع والتغذية
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Fund Expenses History Modal */}
      {viewHistoryFund && (
        <Modal
          isOpen={!!viewHistoryFund}
          onClose={() => setViewHistoryFund(null)}
          title={`حركات ومصروفات: ${viewHistoryFund.name}`}
          description={`إجمالي الفواتير المسجلة على هذا الصندوق`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {expenses.filter((e) => e.fundId === viewHistoryFund.id).map((exp) => (
                <div key={exp.id} className="py-3 flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <div>
                    <p className="font-bold text-slate-800">{exp.description}</p>
                    <p className="text-xs text-slate-400">
                      {exp.vendorName} • فاتورة {exp.invoiceNumber} • {exp.submittedAt}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="font-black text-slate-900 block dir-ltr">
                      {formatCurrency(exp.totalWithTax)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      ضريبة: {formatCurrency(exp.taxAmount)}
                    </span>
                  </div>
                </div>
              ))}

              {expenses.filter((e) => e.fundId === viewHistoryFund.id).length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  لا توجد حركات مصروفات مسجلة على هذا الصندوق حتى الآن
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setViewHistoryFund(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Fund Allocation Modal */}
      <NewFundModal isOpen={isNewFundOpen} onClose={() => setIsNewFundOpen(false)} />
    </div>
  );
};
