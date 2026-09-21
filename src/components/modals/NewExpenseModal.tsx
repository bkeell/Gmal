import React, { useState } from 'react';
import { dataStore } from '../../lib/storage';
import { ExpenseCategory } from '../../types/domain';
import { formatCurrency, EXPENSE_CATEGORY_CONFIG } from '../../lib/utils/format';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { AlertTriangle, Receipt } from 'lucide-react';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTaskId?: string;
  initialFundId?: string;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({ 
  isOpen, 
  onClose,
  initialTaskId,
  initialFundId
}) => {
  const funds = dataStore.getFunds();
  const tasks = dataStore.getTasks();
  const settings = dataStore.getSettings();

  const [fundId, setFundId] = useState(initialFundId || funds[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('materials');
  const [description, setDescription] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [taskId, setTaskId] = useState(initialTaskId || '');
  const [hasReceipt, setHasReceipt] = useState(true);

  // Sync when initial values change
  React.useEffect(() => {
    if (initialTaskId) setTaskId(initialTaskId);
    if (initialFundId) setFundId(initialFundId);
  }, [initialTaskId, initialFundId, isOpen]);

  const numAmount = parseFloat(amount) || 0;
  const taxAmount = Number((numAmount * (settings.taxRate / 100)).toFixed(2));
  const totalWithTax = Number((numAmount + taxAmount).toFixed(2));

  const selectedFund = funds.find((f) => f.id === fundId);
  const exceedsLimit = totalWithTax > settings.singleExpenseLimit;
  const exceedsBalance = selectedFund && totalWithTax > selectedFund.currentBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundId || numAmount <= 0 || !description.trim() || !vendorName.trim() || !invoiceNumber.trim()) {
      alert('يرجى إكمال كافة الحقول الإلزامية وتحديد مبلغ صحيح');
      return;
    }

    if (exceedsBalance) {
      alert('المبلغ المطلوب يتجاوز الرصيد المتاح في العهدة المحددة!');
      return;
    }

    const task = tasks.find((t) => t.id === taskId);

    dataStore.addExpense({
      fundId,
      fundName: selectedFund?.name || 'عهدة عامة',
      amount: numAmount,
      category,
      description,
      invoiceNumber,
      vendorName,
      hasReceipt,
      receiptUrl: hasReceipt ? 'https://images.unsplash.com/photo-1554415707-9e4c019d4536?w=500&auto=format&fit=crop&q=80' : undefined,
      taskId: taskId || undefined,
      taskTitle: task?.title,
    });

    onClose();
    // Reset
    setAmount('');
    setDescription('');
    setInvoiceNumber('');
    setVendorName('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل مصروف عهدة جديد"
      description="رفع فاتورة مصروف ميداني مع احتساب ضريبة القيمة المضافة وخصمها من رصيد العهدة"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Fund Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">الصندوق / العهدة النقدية *</label>
          <select
            value={fundId}
            onChange={(e) => setFundId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            required
          >
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — الرصيد المتاح: {formatCurrency(f.currentBalance, f.currency)} ({f.holderName})
              </option>
            ))}
          </select>
        </div>

        {/* Amount & Tax Live Calculation */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.01"
              label="المبلغ الأساسي (قبل الضريبة) *"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">تصنيف المصروف *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
              >
                {Object.entries(EXPENSE_CATEGORY_CONFIG).map(([catKey, catVal]) => (
                  <option key={catKey} value={catKey}>
                    {catVal.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Calculation Display */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              ضريبة القيمة المضافة ({settings.taxRate}%): <span className="font-bold text-slate-800 dir-ltr">{formatCurrency(taxAmount)}</span>
            </span>
            <span className="text-sm font-black text-indigo-900">
              الإجمالي شامل الضريبة: <span className="dir-ltr">{formatCurrency(totalWithTax)}</span>
            </span>
          </div>

          {exceedsLimit && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>تنبيه: المبلغ يتجاوز السقف المحدد للمصروف الفردي ({formatCurrency(settings.singleExpenseLimit)}) ويتطلب موافقة خاصة.</span>
            </div>
          )}

          {exceedsBalance && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>تحذير: المبلغ الإجمالي يتجاوز الرصيد المتبقي في العهدة!</span>
            </div>
          )}
        </div>

        {/* Invoice & Vendor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="اسم المورد / المتجر *"
            placeholder="مثال: شركة أدنوك، محل مواد البناء"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            required
          />

          <Input
            label="رقم الفاتورة الضريبية *"
            placeholder="مثال: INV-2026-884"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">بيان الصرف وتفاصيل المشتريات *</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="شراء قطع غيار كهربائية ومفاتيح تشغيل للموقع الصناعي..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            required
          />
        </div>

        {/* Linked Task & Receipt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">ربط بمهمة ميدانية (اختياري)</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">بدون ربط بمهمة</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.location})
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 pt-5 cursor-pointer">
            <input
              type="checkbox"
              checked={hasReceipt}
              onChange={(e) => setHasReceipt(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-xs font-bold text-slate-700">مرفق صورة الفاتورة / الإيصال الورقي</span>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="md" type="button" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={exceedsBalance}>
            تسجيل واعتماد الخصم
          </Button>
        </div>
      </form>
    </Modal>
  );
};
