import React from 'react';
import { Users, Mail, Phone, Building, Briefcase, CheckSquare, Wallet, Shield } from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { ROLE_LABELS } from '../../lib/rbac/permissions';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface TeamViewProps {
  onSelectView: (view: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ onSelectView }) => {
  const users = dataStore.getUsers();
  const tasks = dataStore.getTasks();
  const funds = dataStore.getFunds();

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">سجل فريق العمل والمهندسين الميدانيين</h3>
          <p className="text-xs text-slate-500">استعراض الكوادر التشغيلية وتوزيع أعباء العمل والمسؤوليات</p>
        </div>
        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
          {users.length} موظفين مسجلين
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const roleCfg = ROLE_LABELS[user.role];
          const userTasks = tasks.filter((t) => t.assigneeId === user.id);
          const activeTasks = userTasks.filter((t) => t.status === 'in_progress' || t.status === 'todo');
          const userFunds = funds.filter((f) => f.holderId === user.id);

          return (
            <Card key={user.id} hover className="border-slate-200/90 shadow-xs">
              <div className="p-5 space-y-4">
                {/* User Header */}
                <div className="flex items-start gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">{user.name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${roleCfg.badgeColor}`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-600 font-medium">{user.roleTitleAr}</p>
                    <p className="text-[11px] text-slate-400">{user.department}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user.phone || '+971 50 123 4567'}</span>
                  </div>
                </div>

                {/* Workload Stats */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 block mb-0.5">المهام النشطة</span>
                    <span className="font-black text-slate-900">{activeTasks.length} مهام</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 block mb-0.5">العهد المسؤولة</span>
                    <span className="font-black text-emerald-700">{userFunds.length} صناديق</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      dataStore.switchUser(user.id);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer"
                  >
                    تسجيل الدخول بهذا المستخدم &rarr;
                  </button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectView('tasks')}
                    className="text-xs text-slate-600"
                  >
                    عرض المهام
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
