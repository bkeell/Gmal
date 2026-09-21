import React, { useState } from 'react';
import { Users, Plus, Shield, Search, CheckCircle2, XCircle } from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { Role } from '../../types/domain';
import { ROLE_LABELS } from '../../lib/rbac/permissions';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';

export const AdminUsersView: React.FC = () => {
  const users = dataStore.getUsers();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('field_officer');
  const [department, setDepartment] = useState('العمليات الميدانية');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    dataStore.addUser({
      name,
      email,
      role,
      phone: '+971 50 889 4432',
      department,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      active: true,
      roleTitleAr: ROLE_LABELS[role].titleAr,
    });

    setIsAddUserOpen(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">إدارة حسابات المستخدمين ومسؤولي النظام</h3>
          <p className="text-xs text-slate-500">التحكم في وصول المستخدمين، تفعيل الحسابات وتحديد الصلاحيات</p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddUserOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="text-xs sm:text-sm"
        >
          إضافة مستخدم جديد
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-4">المستخدم</th>
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4">القسم</th>
                <th className="p-4">الدور الوظيفي</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">التبديل الفوري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const roleCfg = ROLE_LABELS[u.role];

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-300"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.roleTitleAr}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-xs">{u.email}</td>
                    <td className="p-4 text-slate-700">{u.department}</td>
                    <td className="p-4">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-md border font-bold ${roleCfg.badgeColor}`}>
                        {roleCfg.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> نشط
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dataStore.switchUser(u.id)}
                        className="text-xs"
                      >
                        تجربة الدخول
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="إضافة مستخدم جديد للنظام"
        description="تسجيل حساب لموظف أو محاسب وتعيين الصلاحية المناسبة"
        maxWidth="md"
      >
        <form onSubmit={handleAddUser} className="space-y-4 text-xs sm:text-sm">
          <Input
            label="الاسم الكامل *"
            placeholder="مثال: يوسف أحمد السويدي"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            type="email"
            label="البريد الإلكتروني *"
            placeholder="user@opsplatform.ae"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">الدور والصلاحية (RBAC) *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            >
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label} - {v.titleAr}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="القسم / الإدارة"
            placeholder="مثال: إدارة المشاريع الميدانية"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="md" type="button" onClick={() => setIsAddUserOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" size="md" type="submit">
              حفظ الحساب
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
