import React, { useState } from 'react';
import {
  Plus,
  X,
  CheckSquare,
  Receipt,
  Target,
  FileCheck2,
  ShieldAlert,
} from 'lucide-react';
import { dataStore } from '../../lib/storage';

interface GlobalQuickActionFabProps {
  onOpenNewTask: () => void;
  onOpenNewExpense: () => void;
  onSelectView: (view: string) => void;
}

export const GlobalQuickActionFab: React.FC<GlobalQuickActionFabProps> = ({
  onOpenNewTask,
  onOpenNewExpense,
  onSelectView,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = dataStore.getCurrentUser();

  const handleSos = () => {
    setIsOpen(false);
    const reason = window.prompt('طلب استغاثة وتدخل ميداني عاجل (SOS):', 'عائق طارئ بالموقع يتطلب مساندة فورية');
    if (reason) {
      dataStore.addNotification({
        title: 'استغاثة ميدانية عاجلة (SOS) 🚨',
        message: `أرسل ${currentUser.name} بلاغ استغاثة: ${reason}`,
        type: 'alert',
        targetView: 'daily',
      });
      alert('تم إرسال إشعار الاستغاثة لجميع المشرفين والإدارة المعنية.');
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start select-none">
      {/* Expanded Menu Actions */}
      {isOpen && (
        <div className="mb-3 flex flex-col items-start gap-2 animate-in fade-in slide-in-from-bottom-3 duration-150">
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenNewTask();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white text-slate-800 shadow-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span>مهمة ميدانية جديدة</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onOpenNewExpense();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white text-slate-800 shadow-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <span>تسجيل فاتورة مصروف</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onSelectView('daily');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white text-slate-800 shadow-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <span>لوحة اليوم الموحدة</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onSelectView('approvals');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white text-slate-800 shadow-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <span>مركز الاعتمادات</span>
          </button>

          <button
            onClick={handleSos}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-600 text-white shadow-xl hover:bg-rose-700 text-xs font-bold transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span>طلب استغاثة ميداني (SOS)</span>
          </button>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-2xl transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-900 text-white rotate-45 scale-105'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 active:scale-95'
        }`}
        title="الإجراءات السريعة"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
