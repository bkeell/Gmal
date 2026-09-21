import React from 'react';
import { Shield, CheckCircle2, XCircle, Lock, Users } from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { ROLE_PERMISSIONS, ROLE_LABELS, hasPermission } from '../../lib/rbac/permissions';
import { Role } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

export const AdminRolesView: React.FC = () => {
  const currentUser = dataStore.getCurrentUser();
  const roles: Role[] = ['admin', 'ops_manager', 'finance_officer', 'field_officer', 'viewer'];

  const modules = [
    { id: 'dashboard', name: 'لوحة التحكم والمؤشرات' },
    { id: 'tasks', name: 'إدارة المهام الميدانية' },
    { id: 'followUps', name: 'المتابعات والحرجة' },
    { id: 'funds', name: 'صناديق العهد النقدية' },
    { id: 'expenses', name: 'المصروفات وفواتير الشراء' },
    { id: 'settlements', name: 'التسويات وإقفال العهد' },
    { id: 'reports', name: 'التقارير ومؤشرات الأداء' },
    { id: 'team', name: 'فريق العمل والمهندسين' },
    { id: 'users', name: 'إدارة حسابات المستخدمين' },
    { id: 'roles', name: 'مصفوفة الصلاحيات' },
    { id: 'audit', name: 'سجل التدقيق الأمني' },
    { id: 'settings', name: 'إعدادات النظام العامة' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base text-slate-900">مصفوفة الصلاحيات وأدوار المستخدمين (RBAC)</h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
              دورك الحالي: {currentUser.roleTitleAr}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            التحكم في مستويات الوصول، اعتمادات الصرف المالي، التعديل، والحذف حسب الدور الوظيفي
          </p>
        </div>
      </div>

      {/* Role Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {roles.map((r) => {
          const cfg = ROLE_LABELS[r];
          const isCurrent = currentUser.role === r;

          return (
            <Card key={r} className={`p-4 ${isCurrent ? 'ring-2 ring-indigo-600 bg-indigo-50/20' : ''}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${cfg.badgeColor}`}>
                    {r}
                  </span>
                  {isCurrent && (
                    <Badge variant="info" size="sm">
                      أنت هنا
                    </Badge>
                  )}
                </div>
                <h4 className="font-black text-sm text-slate-900">{cfg.label}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{cfg.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Permission Table */}
      <Card>
        <CardHeader>
          <CardTitle>جدول الصلاحيات المفصل لكل دور</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-4">الوحدة الوظيفية</th>
                {roles.map((r) => (
                  <th key={r} className="p-4 text-center">
                    {ROLE_LABELS[r].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modules.map((mod) => (
                <tr key={mod.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-800">{mod.name}</td>
                  {roles.map((r) => {
                    const canView = hasPermission(r, mod.id, 'view');
                    const canCreate = hasPermission(r, mod.id, 'create');
                    const canApprove = hasPermission(r, mod.id, 'approve');

                    return (
                      <td key={r} className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {canView ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              عرض
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-medium">
                              محظور
                            </span>
                          )}

                          {canCreate && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                              إنشاء
                            </span>
                          )}

                          {canApprove && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                              اعتماد
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
