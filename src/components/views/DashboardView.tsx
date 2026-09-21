import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Calendar,
  Building,
  Plus,
  FileCheck,
} from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { ReportsService } from '../../services/reports.service';
import { AIService, AIOperationsAnalysis } from '../../services/ai.service';
import { formatCurrency, formatDate, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, EXPENSE_STATUS_CONFIG } from '../../lib/utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { OperationsCashFlowChart, ExpenseDonutChart } from '../charts/OperationsCharts';

interface DashboardViewProps {
  onSelectView: (view: string) => void;
  onOpenNewTask: () => void;
  onOpenNewExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectView,
  onOpenNewTask,
  onOpenNewExpense,
}) => {
  const [metrics, setMetrics] = useState(ReportsService.getDashboardMetrics());
  const [aiAnalysis, setAiAnalysis] = useState<AIOperationsAnalysis | null>(null);
  const [loadingAi, setLoadingAi] = useState(true);

  const currentUser = dataStore.getCurrentUser();
  const funds = dataStore.getFunds();
  const tasks = dataStore.getTasks();
  const expenses = dataStore.getExpenses();
  const categoryBreakdown = ReportsService.getExpenseCategoryBreakdown();

  useEffect(() => {
    const update = () => {
      setMetrics(ReportsService.getDashboardMetrics());
    };
    const unsubscribe = dataStore.subscribe(update);

    // Run AI analysis
    AIService.analyzeOperations().then((res) => {
      setAiAnalysis(res);
      setLoadingAi(false);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مرحباً، {currentUser.name} ({currentUser.roleTitleAr})</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              منظومة إدارة العمليات والعهد النقدية
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              تتبع فوري للأرصدة النقدية للعهد، فواتير المصروفات الميدانية، مراحل إنجاز المهام، وإقفال التسويات بدقة محاسبية معتمدة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={onOpenNewExpense}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm"
              icon={<Receipt className="w-4 h-4 text-emerald-400" />}
            >
              + إضافة مصروف جديد
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onOpenNewTask}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs sm:text-sm shadow-indigo-500/30"
              icon={<Plus className="w-4 h-4" />}
            >
              + إنشاء مهمة ميدانية
            </Button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Petty Cash Funds Health */}
        <Card hover className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">رصيد العهد النقدية الحية</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(metrics.totalRemainingFunds)}
            </h3>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>المخصص الإجمالي: {formatCurrency(metrics.totalAllocatedFunds)}</span>
              <span className="font-bold text-emerald-600">{metrics.fundLiquidityRate}% سيولة</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.fundLiquidityRate)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Metric 2: Active Tasks */}
        <Card hover className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المهام الميدانية الجارية</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {metrics.inProgressTasks}
              </h3>
              <span className="text-xs text-slate-400 font-medium">من أصل {metrics.totalTasks} مهمة</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {metrics.urgentTasks > 0 ? (
                <Badge variant="danger" size="sm">
                  {metrics.urgentTasks} مهام حرجة عاجلة
                </Badge>
              ) : (
                <Badge variant="success" size="sm">
                  جميع المهام مستقرة
                </Badge>
              )}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.taskCompletionRate}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Metric 3: Pending Expenses for Approval */}
        <Card hover className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">فواتير بانتظار الاعتماد</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(metrics.pendingExpensesAmount)}
            </h3>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>{metrics.pendingExpensesCount} فواتير قيد التدقيق</span>
              <button
                onClick={() => onSelectView('expenses')}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                معاينة
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>تتطلب موافقة المسؤول المالي</span>
            </div>
          </div>
        </Card>

        {/* Metric 4: Operations Completion Rate */}
        <Card hover className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">نسبة إنجاز الأعمال</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {metrics.taskCompletionRate}%
              </h3>
              <span className="text-xs text-emerald-600 font-bold">معدل ممتاز</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              تم إنجاز {metrics.completedTasks} مهمة بالكامل مع تسوية دورية للعهد.
            </p>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{metrics.settlementsCount} تسويات مسجلة</span>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Operations Advisor Banner */}
      {aiAnalysis && (
        <div className="bg-linear-to-r from-indigo-50 via-purple-50 to-white rounded-2xl p-5 border border-indigo-100 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-indigo-950 text-sm sm:text-base">
                    مستشار العمليات والمالية الذكي (AI Ops Advisor)
                  </h4>
                  <span className="text-[10px] bg-indigo-200/80 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    مؤشر الكفاءة: {aiAnalysis.healthScore}/100
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  {aiAnalysis.executiveBriefing}
                </p>
              </div>
            </div>

            {aiAnalysis.insights[0] && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => aiAnalysis.insights[0].targetModule && onSelectView(aiAnalysis.insights[0].targetModule)}
                className="shrink-0 text-xs"
              >
                {aiAnalysis.insights[0].actionLabel || 'اتخاذ إجراء'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Visual Analytics Row: Cash Flow Stream & Donut Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cash Flow Evolution */}
        <div className="lg:col-span-7">
          <Card className="p-5 h-full">
            <CardHeader className="p-0 pb-3">
              <div>
                <CardTitle>مسار التدفق المالي وحركة العهد (Cash Flow Timeline)</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">تتبع حركة الرصيد المتاح والمصروفات المتراكمة عبر الأسابيع</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                سيولة نقدية مستقرة
              </span>
            </CardHeader>
            <OperationsCashFlowChart />
          </Card>
        </div>

        {/* Expense Distribution Donut Chart */}
        <div className="lg:col-span-5">
          <Card className="p-5 h-full flex flex-col justify-between">
            <CardHeader className="p-0 pb-3">
              <div>
                <CardTitle>توزيع المصروفات حسب البنود</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">نسبة مشاركة كل بند في إجمالي الإنفاق</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectView('reports')}
                className="text-xs text-indigo-600 font-bold"
              >
                التقارير
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <ExpenseDonutChart data={categoryBreakdown} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
              {categoryBreakdown.slice(0, 3).map((cat, idx) => {
                const dotColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500'];
                return (
                  <div key={cat.category} className="text-right">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800 block mt-0.5 dir-ltr text-right">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Petty Cash Funds Health Status */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>حالة صناديق العهد النقدية الحالية</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">تتبع نسب السيولة والاستهلاك لكل عهدة ميدانية</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectView('funds')}
            className="text-xs text-indigo-600 font-bold"
          >
            إدارة العهد
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funds.map((fund) => {
            const percent = Math.round((fund.currentBalance / fund.totalAllocation) * 100);
            const isWarning = percent <= fund.warningThreshold;

            return (
              <div key={fund.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white transition space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 truncate">{fund.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{fund.code}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      المسؤول: <span className="text-slate-700 font-medium">{fund.holderName}</span> ({fund.holderDepartment})
                    </p>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-sm font-black text-slate-900 block dir-ltr">
                      {formatCurrency(fund.currentBalance, fund.currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      من {formatCurrency(fund.totalAllocation, fund.currency)}
                    </span>
                  </div>
                </div>

                {/* Balance Micro-gauge Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className={isWarning ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      المتبقي: {percent}%
                    </span>
                    <span className="text-slate-400">
                      المصروف: {formatCurrency(fund.spentBalance, fund.currency)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        percent <= 20
                          ? 'bg-rose-500'
                          : percent <= 40
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Two Column Grid: Recent Urgent Tasks + Recent Invoices/Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent & In-Progress Tasks */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>المهام الميدانية الجارية والحرجة</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">آخر التطورات التشغيلية والمواعيد المستحقة</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectView('tasks')}
              className="text-xs"
            >
              عرض كافة المهام ({tasks.length})
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {tasks.slice(0, 4).map((task) => {
              const statusCfg = TASK_STATUS_CONFIG[task.status];
              const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];

              return (
                <div key={task.id} className="p-4 hover:bg-slate-50/80 transition flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 truncate">{task.title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {task.location}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">المسؤول: {task.assigneeName}</span>
                      <span>•</span>
                      <span className="text-slate-500">تاريخ التسليم: {formatDate(task.dueDate)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-md border font-bold ${priorityCfg.color}`}>
                      {priorityCfg.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color} font-medium`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Expenses & Invoices */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>أحدث مطالبات الصرف والفواتير</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">فواتير العهد المرفوعة من الفرق الميدانية</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectView('expenses')}
              className="text-xs"
            >
              سجل المصروفات ({expenses.length})
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {expenses.slice(0, 4).map((exp) => {
              const statusCfg = EXPENSE_STATUS_CONFIG[exp.status];

              return (
                <div key={exp.id} className="p-4 hover:bg-slate-50/80 transition flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 truncate">{exp.description}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{exp.vendorName}</span>
                      <span>•</span>
                      <span className="text-slate-400 font-mono">فاتورة: {exp.invoiceNumber}</span>
                      <span>•</span>
                      <span className="text-slate-500">مقدم الطلب: {exp.submittedBy}</span>
                    </div>
                  </div>

                  <div className="text-left shrink-0 space-y-1">
                    <span className="font-black text-sm text-slate-900 block dir-ltr">
                      {formatCurrency(exp.totalWithTax)}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color} font-bold inline-block`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
