import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Wallet,
  CheckCircle2,
  Users,
  FileSpreadsheet,
} from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { ReportsService } from '../../services/reports.service';
import { formatCurrency } from '../../lib/utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const metrics = ReportsService.getDashboardMetrics();
  const categoryBreakdown = ReportsService.getExpenseCategoryBreakdown();
  const teamPerformance = ReportsService.getTeamPerformance();
  const funds = dataStore.getFunds();

  const handleExportCSV = () => {
    const csvData = ReportsService.exportExpensesToCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تقرير_المصروفات_الشامل_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">التقارير التحليلية ومؤشرات الأداء (KPIs)</h3>
          <p className="text-xs text-slate-500">تحليلات دقيقة لإنفاق العهد النقدية، تكاليف المشاريع، ومعدلات إنجاز الفرق</p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleExportCSV}
          icon={<Download className="w-4 h-4" />}
          className="text-xs sm:text-sm shadow-xs"
        >
          تصدير التقرير المالي الشامل (CSV)
        </Button>
      </div>

      {/* Top 3 Analytical Summary Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">معدل دوران العهد النقدية</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {metrics.fundLiquidityRate}%
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            نسبة السيولة المتبقية من إجمالي التخصيص {formatCurrency(metrics.totalAllocatedFunds)}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full"
              style={{ width: `${Math.min(100, metrics.fundLiquidityRate)}%` }}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">كفاءة إنجاز المهام الميدانية</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {metrics.taskCompletionRate}%
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            تم إنهاء {metrics.completedTasks} مهمة بالكامل من أصل {metrics.totalTasks}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${metrics.taskCompletionRate}%` }}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">متوسط تكلفة المهمة</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(metrics.totalExpensesAmount / (metrics.totalTasks || 1))}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            إجمالي المنصرف {formatCurrency(metrics.totalExpensesAmount)}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '70%' }} />
          </div>
        </Card>
      </div>

      {/* Interactive Recharts Bar Chart for Category Spend Breakdown */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>مخطط تحليل بنود الصرف والإنفاق الفعلي</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">مقارنة بصرية لحجم المبالغ المنصرفة لكل بند تشغيلي</p>
          </div>
          <Badge variant="default" size="sm">
            إجمالي {categoryBreakdown.length} بنود مصنفة
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="w-full h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBreakdown.map((c) => ({ name: c.label, amount: c.amount, count: c.count }))}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1 min-w-[150px]" dir="rtl">
                          <strong className="text-slate-900 block border-b border-slate-100 pb-1">{label}</strong>
                          <div className="flex justify-between items-center text-slate-600 mt-1">
                            <span>المبلغ المنصرف:</span>
                            <span className="font-bold font-mono text-indigo-700">{formatCurrency(payload[0]?.value as number)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400 text-[11px]">
                            <span>عدد الفواتير:</span>
                            <span>{payload[0]?.payload?.count} فواتير</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {categoryBreakdown.map((_, index) => {
                    const colors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
                    return <Cell key={`bar-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Team Productivity & Spending Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>كفاءة الموظفين وإنفاق العهد الميدانية</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">مؤشرات إنجاز المهام ومجموع الفواتير المسجلة لكل مسؤول</p>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-4">الموظف / المهندس</th>
                <th className="p-4">القسم</th>
                <th className="p-4">المهام المسندة</th>
                <th className="p-4">المهام المنجزة</th>
                <th className="p-4">نسبة الإنجاز</th>
                <th className="p-4">إجمالي المنصرف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamPerformance.map((member) => (
                <tr key={member.userId} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-300"
                      />
                      <span className="font-bold text-slate-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{member.department}</td>
                  <td className="p-4 font-semibold text-slate-800">{member.assignedTasks} مهام</td>
                  <td className="p-4 font-semibold text-emerald-700">{member.completedTasks} منجزة</td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {member.completionRate}%
                    </span>
                  </td>
                  <td className="p-4 font-black text-slate-900 dir-ltr text-right">
                    {formatCurrency(member.totalSpent)}
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
