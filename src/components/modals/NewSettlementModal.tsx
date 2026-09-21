import React, { useState } from 'react';
import { dataStore } from '../../lib/storage';
import { SettlementsService } from '../../services/settlements.service';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { formatCurrency } from '../../lib/utils/format';

interface NewSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewSettlementModal: React.FC<NewSettlementModalProps> = ({ isOpen, onClose }) => {
  const funds = dataStore.getFunds();
  const expenses = dataStore.getExpenses();

  const [fundId, setFundId] = useState(funds[0]?.id || '');
  const [periodStart, setPeriodStart] = useState('2026-03-01');
  const [periodEnd, setPeriodEnd] = useState('2026-03-31');
  const [notes, setNotes] = useState('إقفال دوري لمصروفات وفواتير العهدة لشهر مارس 2026');

  const selectedFund = funds.find((f) => f.id === fundId);
  // Calculate expenses for this fund that are approved
  const eligibleExpenses = expenses.filter(
    (e) => e.fundId === fundId && (e.status === 'approved' || e.status === 'pending_approval')
  );
  const totalExpensesAmount = eligibleExpenses.reduce((s, e) => s + e.totalWithTax, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundId || !periodStart || !periodEnd) {
      alert('يرجى تحديد العهدة والفترة الزمنية للتسوية');
      return;
    }

    SettlementsService.create({
      fundId,
      periodStart,
      periodEnd,
      notes,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إنشاء دورة تسوية وإقفال عهدة نقدية"
      description="مطابقة الفواتير الميدانية واحتساب الرصيد المتبقي لتصفية الحساب أو إعادة التغذية"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">صندوق العهدة المراد تصفيته *</label>
          <select
            value={fundId}
            onChange={(e) => setFundId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            required
          >
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — أمين العهدة: {f.holderName} (الرصيد المتبقي: {formatCurrency(f.currentBalance, f.currency)})
              </option>
            ))}
          </select>
        </div>

        {selectedFund && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">التخصيص الأصلي للعهدة:</span>
              <span className="font-bold text-slate-800 dir-ltr">{formatCurrency(selectedFund.totalAllocation)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">الفواتير المؤهلة للتسوية:</span>
              <span className="font-bold text-indigo-700 dir-ltr">
                {eligibleExpenses.length} فواتير بقيمة {formatCurrency(totalExpensesAmount)}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-700">النقد المتبقي لإعادته أو تدويره:</span>
              <span className="font-black text-emerald-700 dir-ltr">
                {formatCurrency(selectedFund.currentBalance)}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="بداية فترة التسوية *"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />

          <Input
            type="date"
            label="نهاية فترة التسوية *"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">ملاحظات وقرار لجنة التسوية</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="md" type="button" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" size="md" type="submit">
            إنشاء دورة التسوية والمطابقة
          </Button>
        </div>
      </form>
    </Modal>
  );
};
