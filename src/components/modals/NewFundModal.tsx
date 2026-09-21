import React, { useState } from 'react';
import { dataStore } from '../../lib/storage';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface NewFundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewFundModal: React.FC<NewFundModalProps> = ({ isOpen, onClose }) => {
  const users = dataStore.getUsers();
  const settings = dataStore.getSettings();

  const [name, setName] = useState('');
  const [holderId, setHolderId] = useState('');
  const [totalAllocation, setTotalAllocation] = useState('20000');
  const [warningThreshold, setWarningThreshold] = useState('25');
  const [purpose, setPurpose] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !holderId || parseFloat(totalAllocation) <= 0) {
      alert('يرجى إكمال الحقول الإلزامية');
      return;
    }

    const holder = users.find((u) => u.id === holderId);
    if (!holder) return;

    dataStore.addFund({
      name,
      holderId: holder.id,
      holderName: holder.name,
      holderDepartment: holder.department,
      totalAllocation: parseFloat(totalAllocation),
      currency: settings.currency,
      warningThreshold: parseInt(warningThreshold) || 25,
      purpose,
    });

    onClose();
    setName('');
    setPurpose('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تخصيص صندوق عهدة نقدية جديد"
      description="إنشاء صندوق عهدة نقدية مؤقتة أو مستديمة لموظف أو مشروع ميداني"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <Input
          label="اسم صندوق العهدة *"
          placeholder="مثال: عهدة مشاريع أبوظبي الميدانية"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">الموظف أمين العهدة *</label>
          <select
            value={holderId}
            onChange={(e) => setHolderId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            required
          >
            <option value="">اختر الموظف المسؤول...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.department} - {u.roleTitleAr})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="number"
            label="مبلغ التخصيص الإجمالي (درهم) *"
            value={totalAllocation}
            onChange={(e) => setTotalAllocation(e.target.value)}
            required
          />

          <Input
            type="number"
            label="نسبة تنبيه انخفاض الرصيد (%)"
            value={warningThreshold}
            onChange={(e) => setWarningThreshold(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">الغرض من العهدة والنفقات المسموحة</label>
          <textarea
            rows={3}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="مثال: مصاريف النقل، المواد المستعجلة، الوقود ورسوم التصاريح السريعة للموقع..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="md" type="button" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" size="md" type="submit">
            تأكيد التخصيص
          </Button>
        </div>
      </form>
    </Modal>
  );
};
