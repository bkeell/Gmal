import React, { useState } from 'react';
import { History, Shield, Filter, Search, Clock, User, CheckCircle2 } from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

export const AdminAuditView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const auditLogs = dataStore.getAuditLogs();

  const filteredLogs = auditLogs.filter((log) => {
    const matchesMod = moduleFilter === 'all' || log.entity === moduleFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);

    return matchesMod && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">سجل التدقيق والرقابة الأمني (Audit Log)</h3>
          <p className="text-xs text-slate-500">
            توثيق تاريخي غير قابل للتعديل لجميع العمليات المالية والتنفيذية والحركات في النظام
          </p>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
          {auditLogs.length} سجلات موثقة
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="بحث في الإجراء، اسم المستخدم، أو التفاصيل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700"
        >
          <option value="all">كافة الوحدات</option>
          <option value="tasks">المهام</option>
          <option value="funds">العهد النقدية</option>
          <option value="expenses">المصروفات</option>
          <option value="settlements">التسويات</option>
          <option value="auth">الدخول والصلاحيات</option>
        </select>
      </div>

      {/* Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-4">الوقت والتاريخ</th>
                <th className="p-4">المستخدم</th>
                <th className="p-4">الوحدة</th>
                <th className="p-4">نوع الإجراء</th>
                <th className="p-4">التفاصيل والبيان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs">
                      {log.entity}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-800 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="p-4 text-slate-600 max-w-md">
                    <p className="line-clamp-2">{log.details}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
