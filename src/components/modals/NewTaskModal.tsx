import React, { useState } from 'react';
import { dataStore } from '../../lib/storage';
import { TaskPriority } from '../../types/domain';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('زيارة ميدانية');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('10:00');
  const [proofRequired, setProofRequired] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('تشغيل وصيانة');
  const [budget, setBudget] = useState('2000');
  const [fundId, setFundId] = useState('');
  const [checklistText, setChecklistText] = useState('فحص الموقع وإصدار التصريح\nتنفيذ الأعمال الفنية المطلوبة\nالمطابقة والفحص النهائي');

  const users = dataStore.getUsers();
  const funds = dataStore.getFunds();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !location.trim()) {
      alert('يرجى تعبئة كافة الحقول الإلزامية');
      return;
    }

    const assignedUser = users.find((u) => u.id === (assigneeId || users[0].id)) || users[0];
    const checklistItems = checklistText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((text, idx) => ({
        id: `chk-${Date.now()}-${idx}`,
        text,
        completed: false,
      }));

    dataStore.addTask({
      title,
      description,
      priority,
      status: 'scheduled',
      taskType,
      clientName: clientName || undefined,
      clientPhone: clientPhone || undefined,
      dueTime: dueTime || undefined,
      proofRequired: proofRequired || undefined,
      assigneeId: assignedUser.id,
      assigneeName: assignedUser.name,
      assigneeAvatar: assignedUser.avatar,
      dueDate,
      startDate: new Date().toISOString().split('T')[0],
      location,
      category,
      budget: parseFloat(budget) || 0,
      tags: [taskType, category, location.split('-')[0].trim()],
      checklist: checklistItems,
      fundId: fundId || undefined,
    });

    onClose();
    // Reset form
    setTitle('');
    setDescription('');
    setLocation('');
    setClientName('');
    setClientPhone('');
    setProofRequired('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إنشاء مهمة ميدانية جديدة"
      description="إسناد مهام تشغيلية جديدة لفرق العمل وتحديد الميزانية والمواعيد"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Input
              label="عنوان المهمة *"
              placeholder="مثال: فحص وتحديث لوحة التوزيع الكهربائية"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">نوع وطبيعة المهمة *</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="زيارة ميدانية">زيارة ميدانية</option>
              <option value="تحصيل مالي">تحصيل مالي واستلام دفعات</option>
              <option value="تسليم واستلام">تسليم واستلام مستندات</option>
              <option value="صيانة وتشغيل">صيانة وتشغيل فني</option>
              <option value="تدقيق ومراجعة">تدقيق ومراجعة ميدانية</option>
              <option value="متابعة تكميلية">متابعة تكميلية</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="الجهة المستهدفة / العميل"
            placeholder="مثال: شركة النور للمقاولات العامة"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <Input
            label="رقم هاتف مسؤول العميل / الموقع"
            placeholder="مثال: 0501234567"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">وصف المهمة والمتطلبات</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="شرح تفصيلي لما يجب على المهندس أو الفني إنجازه في الموقع..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>

        <div className="space-y-1.5">
          <Input
            label="المطلوب إثباته عند الإنجاز (Proof Requirement)"
            placeholder="مثال: صورة سند القبض الموقع وختم الشركة، أو محضر المعاينة الفني"
            value={proofRequired}
            onChange={(e) => setProofRequired(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">الأولوية التشغيلية</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="urgent">حرجة / عاجلة جداً</option>
              <option value="high">أولوية مرتفعة</option>
              <option value="medium">أولوية متوسطة</option>
              <option value="low">عادية / منخفضة</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">الموظف / المهندس المكلف *</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">اختر الموظف...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} - {u.roleTitleAr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <Input
              label="الموقع الجغرافي / المشروع *"
              placeholder="مثال: مجمع المستودعات"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              type="date"
              label="تاريخ الاستحقاق *"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              type="time"
              label="وقت الاستحقاق (ساعة:دقيقة)"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="number"
            label="الميزانية التقديرية (درهم)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">ربط بعهدة نقدية (اختياري)</label>
            <select
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">بدون عهدة محددة</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (المتبقي: {f.currentBalance} {f.currency})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            قائمة بنود الفحص والإنجاز (بند في كل سطر)
          </label>
          <textarea
            rows={3}
            value={checklistText}
            onChange={(e) => setChecklistText(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="md" type="button" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" size="md" type="submit">
            حفظ وإسناد المهمة
          </Button>
        </div>
      </form>
    </Modal>
  );
};
