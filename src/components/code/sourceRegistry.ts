export interface SourceFile {
  path: string;
  category: 'services' | 'pages' | 'finance' | 'admin' | 'database';
  name: string;
  description: string;
  code: string;
}

export const OPS_SOURCE_REGISTRY: SourceFile[] = [
  {
    path: 'database/schema.sql',
    category: 'database',
    name: 'schema.sql',
    description: 'مخطط قاعدة بيانات PostgreSQL / Supabase الكامل للجداول والعلاقات والصلاحيات',
    code: `-- ============================================================
-- OpsPlatform Database Schema (PostgreSQL / Supabase)
-- ============================================================

CREATE TYPE role_type AS ENUM ('admin', 'ops_manager', 'finance_officer', 'field_officer', 'viewer');
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'completed', 'cancelled');
CREATE TYPE fund_status AS ENUM ('active', 'warning', 'depleted', 'closed');
CREATE TYPE expense_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'settled');
CREATE TYPE settlement_status AS ENUM ('draft', 'under_review', 'audited', 'approved', 'closed');

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role role_type NOT NULL DEFAULT 'field_officer',
  phone VARCHAR(50),
  department VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Petty Cash Funds (صناديق العهد النقدية)
CREATE TABLE petty_cash_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  holder_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  total_allocation DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  spent_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'AED',
  status fund_status DEFAULT 'active',
  warning_threshold_percent INT DEFAULT 30,
  last_replenished_at DATE DEFAULT CURRENT_DATE,
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Operational Tasks (المهام الميدانية والتشغيلية)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'todo',
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fund_id UUID REFERENCES petty_cash_funds(id) ON DELETE SET NULL,
  due_date DATE,
  start_date DATE DEFAULT CURRENT_DATE,
  location VARCHAR(255),
  category VARCHAR(100),
  budget DECIMAL(12, 2) DEFAULT 0.00,
  checklist JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Expenses & Invoices (المصروفات والفواتير)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  fund_id UUID REFERENCES petty_cash_funds(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0.00,
  total_with_tax DECIMAL(12, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  invoice_number VARCHAR(100),
  vendor_name VARCHAR(255) NOT NULL,
  receipt_url TEXT,
  status expense_status DEFAULT 'pending_approval',
  submitted_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Financial Settlements (التسويات وإقفال العهد)
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  fund_id UUID REFERENCES petty_cash_funds(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  advance_amount DECIMAL(12, 2) NOT NULL,
  total_expenses DECIMAL(12, 2) NOT NULL,
  remaining_amount DECIMAL(12, 2) NOT NULL,
  status settlement_status DEFAULT 'under_review',
  expense_ids UUID[] NOT NULL,
  settled_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  audit_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs (سجل التدقيق الأمني والرقابي)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
  },
  {
    path: 'services/tasks.service.ts',
    category: 'services',
    name: 'tasks.service.ts',
    description: 'خدمة إدارة المهام التشغيلية، فلترة الحالات، قوائم الفحص والتتبع',
    code: `import { dataStore } from '../lib/storage';
import { Task, TaskPriority, TaskStatus } from '../types/domain';

export class TasksService {
  public static getAll(): Task[] {
    return dataStore.getTasks();
  }

  public static getById(id: string): Task | undefined {
    return dataStore.getTasks().find((t) => t.id === id);
  }

  public static create(data: Omit<Task, 'id' | 'spentAmount' | 'history' | 'createdAt'>): Task {
    return dataStore.addTask(data);
  }

  public static updateStatus(id: string, status: TaskStatus): void {
    dataStore.updateTaskStatus(id, status);
  }

  public static toggleChecklist(taskId: string, itemId: string): void {
    dataStore.toggleTaskChecklistItem(taskId, itemId);
  }

  public static delete(id: string): void {
    dataStore.deleteTask(id);
  }

  public static filter(params: {
    status?: TaskStatus | 'all';
    priority?: TaskPriority | 'all';
    assigneeId?: string;
    search?: string;
  }): Task[] {
    let tasks = dataStore.getTasks();

    if (params.status && params.status !== 'all') {
      tasks = tasks.filter((t) => t.status === params.status);
    }
    if (params.priority && params.priority !== 'all') {
      tasks = tasks.filter((t) => t.priority === params.priority);
    }
    if (params.assigneeId) {
      tasks = tasks.filter((t) => t.assigneeId === params.assigneeId);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q)
      );
    }

    return tasks;
  }
}`
  },
  {
    path: 'services/funds.service.ts',
    category: 'services',
    name: 'funds.service.ts',
    description: 'خدمة إدارة صناديق العهد النقدية، متابعة الأرصدة وإعادة التغذية',
    code: `import { dataStore } from '../lib/storage';
import { PettyCashFund } from '../types/domain';

export class FundsService {
  public static getAll(): PettyCashFund[] {
    return dataStore.getFunds();
  }

  public static getById(id: string): PettyCashFund | undefined {
    return dataStore.getFundById(id);
  }

  public static create(data: Omit<PettyCashFund, 'id' | 'code' | 'spentBalance' | 'currentBalance' | 'status' | 'lastReplenishedDate'>): PettyCashFund {
    return dataStore.addFund(data);
  }

  public static replenish(fundId: string, amount: number, notes?: string): void {
    dataStore.replenishFund(fundId, amount, notes);
  }

  public static getSummary() {
    const funds = dataStore.getFunds();
    const totalAllocated = funds.reduce((sum, f) => sum + f.totalAllocation, 0);
    const totalCurrentBalance = funds.reduce((sum, f) => sum + f.currentBalance, 0);
    const totalSpent = funds.reduce((sum, f) => sum + f.spentBalance, 0);
    const warningCount = funds.filter((f) => f.status === 'warning' || f.status === 'depleted').length;

    return {
      totalAllocated,
      totalCurrentBalance,
      totalSpent,
      warningCount,
      count: funds.length,
    };
  }
}`
  },
  {
    path: 'services/expenses.service.ts',
    category: 'services',
    name: 'expenses.service.ts',
    description: 'خدمة المصروفات والفواتير، احتساب ضريبة القيمة المضافة واعتمادات الصرف',
    code: `import { dataStore } from '../lib/storage';
import { Expense, ExpenseStatus } from '../types/domain';

export class ExpensesService {
  public static getAll(): Expense[] {
    return dataStore.getExpenses();
  }

  public static create(data: Omit<Expense, 'id' | 'code' | 'taxAmount' | 'totalWithTax' | 'status' | 'submittedAt' | 'submittedBy'>): Expense {
    return dataStore.addExpense(data);
  }

  public static approve(id: string): void {
    dataStore.updateExpenseStatus(id, 'approved');
  }

  public static reject(id: string, reason: string): void {
    dataStore.updateExpenseStatus(id, 'rejected', reason);
  }

  public static getSummary() {
    const expenses = dataStore.getExpenses();
    const totalAmount = expenses.reduce((sum, e) => sum + e.totalWithTax, 0);
    const pendingCount = expenses.filter((e) => e.status === 'pending_approval').length;
    const pendingAmount = expenses
      .filter((e) => e.status === 'pending_approval')
      .reduce((sum, e) => sum + e.totalWithTax, 0);

    return {
      totalCount: expenses.length,
      totalAmount,
      pendingCount,
      pendingAmount,
    };
  }
}`
  },
  {
    path: 'services/settlements.service.ts',
    category: 'services',
    name: 'settlements.service.ts',
    description: 'خدمة التسويات المالية، مطابقة الفواتير مع السلف وإصدار سندات التصفية',
    code: `import { dataStore } from '../lib/storage';
import { Settlement } from '../types/domain';

export class SettlementsService {
  public static getAll(): Settlement[] {
    return dataStore.getSettlements();
  }

  public static create(data: Omit<Settlement, 'id' | 'code' | 'status' | 'submittedAt' | 'settledBy'>): Settlement {
    return dataStore.addSettlement(data);
  }

  public static approve(id: string, auditNotes?: string): void {
    dataStore.approveSettlement(id, auditNotes);
  }
}`
  },
  {
    path: 'services/ai.service.ts',
    category: 'services',
    name: 'ai.service.ts',
    description: 'مستشار الذكاء الاصطناعي التشغيلي والمالي لتحليل الكفاءة والمخاطر والتنبيهات',
    code: `import { dataStore } from '../lib/storage';

export class AIService {
  public static async analyzeOperations() {
    const tasks = dataStore.getTasks();
    const funds = dataStore.getFunds();
    const expenses = dataStore.getExpenses();

    const lowFunds = funds.filter((f) => f.status === 'warning' || f.status === 'depleted');
    const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed');
    const pendingExpenses = expenses.filter((e) => e.status === 'pending_approval');

    let healthScore = 95 - (lowFunds.length * 10) - (urgentTasks.length * 5);
    return {
      healthScore: Math.max(30, healthScore),
      lowFundsCount: lowFunds.length,
      urgentTasksCount: urgentTasks.length,
      pendingExpensesCount: pendingExpenses.length,
    };
  }
}`
  },
  {
    path: 'views/DashboardView.tsx',
    category: 'pages',
    name: 'DashboardView.tsx',
    description: 'كود صفحة لوحة التحكم المركزية ومؤشرات الأداء التشغيلية والمالية مع تحليلات الذكاء الاصطناعي',
    code: `import React from 'react';
import { 
  CheckSquare, 
  Wallet, 
  Receipt, 
  FileCheck, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  Sparkles,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { ReportsService } from '../../services/reports.service';
import { AIService } from '../../services/ai.service';
import { formatCurrency, formatDate, TASK_PRIORITY_CONFIG } from '../../lib/utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

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
  const metrics = ReportsService.getDashboardMetrics();
  const currentUser = dataStore.getCurrentUser();
  const funds = dataStore.getFunds().slice(0, 3);
  const recentTasks = dataStore.getTasks().slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold">
              {currentUser.roleTitleAr}
            </span>
            <span className="text-xs text-slate-400">{currentUser.department}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">أهلاً بك، {currentUser.name}</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            نظام المتابعة الحية للعمليات الميدانية والعهد المالية ومطابقة الفواتير
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="md" onClick={onOpenNewTask} icon={<Plus className="w-4 h-4" />}>
            مهمة جديدة
          </Button>
          <Button variant="secondary" size="md" onClick={onOpenNewExpense} className="bg-white/10 hover:bg-white/20 text-white border-white/20">
            تسجيل مصروف
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">نسبة إنجاز المهام</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{metrics.taskCompletionRate}%</span>
            <span className="text-xs text-slate-400">{metrics.completedTasks} من {metrics.totalTasks}</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">رصيد العهد النقدية المتوفر</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-700">{formatCurrency(metrics.totalRemainingFunds)}</span>
            <span className="text-xs text-emerald-600 font-medium">سيولة {metrics.fundLiquidityRate}%</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">إجمالي المصروفات المدققة</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900">{formatCurrency(metrics.totalExpensesAmount)}</span>
            <span className="text-xs text-slate-400">{metrics.pendingExpensesCount} قيد الاعتماد</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">تنبيهات العهد والمهام الحرجة</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700">{metrics.urgentTasks + metrics.fundsWarningCount}</span>
            <span className="text-xs text-rose-600 font-bold">تتطلب إجراءً فورياً</span>
          </div>
        </Card>
      </div>
    </div>
  );
};`
  },
  {
    path: 'views/TasksView.tsx',
    category: 'pages',
    name: 'TasksView.tsx',
    description: 'كود إدارة المهام الميدانية والتشغيلية بنمط كانبان (Kanban) وقوائم الفحص والفلترة الشاملة',
    code: `import React, { useState } from 'react';
import { dataStore } from '../../lib/storage';
import { TasksService } from '../../services/tasks.service';
import { Task, TaskPriority, TaskStatus } from '../../types/domain';
import { formatCurrency, formatDate, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '../../lib/utils/format';
import { hasPermission } from '../../lib/rbac/permissions';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface TasksViewProps {
  onOpenNewTask: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onOpenNewTask }) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  const currentUser = dataStore.getCurrentUser();
  const canCreate = hasPermission(currentUser.role, 'tasks', 'create');

  const filteredTasks = TasksService.filter({
    status: statusFilter,
    priority: priorityFilter,
    search,
  });

  const kanbanColumns: { id: TaskStatus; label: string }[] = [
    { id: 'todo', label: 'قيد الانتظار' },
    { id: 'in_progress', label: 'جاري التنفيذ' },
    { id: 'review', label: 'قيد المراجعة' },
    { id: 'completed', label: 'مكتملة بنجاح' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <input
          type="text"
          placeholder="بحث في المهام والموقع الميداني..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
        />
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button variant="primary" size="md" onClick={onOpenNewTask}>
              + مهمة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kanbanColumns.map((col) => (
          <div key={col.id} className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-800">{col.label}</h4>
            <div className="space-y-2">
              {filteredTasks.filter((t) => t.status === col.id).map((task) => (
                <Card key={task.id} className="p-3 bg-white">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold">{task.priority}</span>
                    <span className="font-mono text-slate-400">{task.code}</span>
                  </div>
                  <h5 className="font-bold text-xs mt-1">{task.title}</h5>
                  <p className="text-[11px] text-slate-500 mt-1">{task.description}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};`
  },
  {
    path: 'views/FinanceFundsView.tsx',
    category: 'finance',
    name: 'FinanceFundsView.tsx',
    description: 'كود صفحة صناديق العهد النقدية، مقاييس السيولة، تنبيهات استنزاف الرصيد ونوافذ التغذية',
    code: `import React, { useState } from 'react';
import { dataStore } from '../../lib/storage';
import { FundsService } from '../../services/funds.service';
import { PettyCashFund } from '../../types/domain';
import { formatCurrency, formatDate, FUND_STATUS_CONFIG } from '../../lib/utils/format';
import { hasPermission } from '../../lib/rbac/permissions';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

export const FinanceFundsView: React.FC = () => {
  const [replenishFund, setReplenishFund] = useState<PettyCashFund | null>(null);
  const currentUser = dataStore.getCurrentUser();
  const funds = dataStore.getFunds();
  const summary = FundsService.getSummary();
  const canApprove = hasPermission(currentUser.role, 'funds', 'approve');

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs text-slate-500 font-bold">إجمالي التخصيص</span>
          <h3 className="text-xl font-black text-slate-900 mt-1">{formatCurrency(summary.totalAllocated)}</h3>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-slate-500 font-bold">الرصيد النقدي المتوفر</span>
          <h3 className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(summary.totalCurrentBalance)}</h3>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-slate-500 font-bold">إجمالي المنصرف</span>
          <h3 className="text-xl font-black text-slate-900 mt-1">{formatCurrency(summary.totalSpent)}</h3>
        </Card>
      </div>

      {/* Funds Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {funds.map((fund) => (
          <Card key={fund.id} className="p-5 border-slate-200">
            <span className="text-xs font-mono font-bold text-indigo-600">{fund.code}</span>
            <h4 className="font-extrabold text-sm text-slate-900 mt-1">{fund.name}</h4>
            <p className="text-xs text-slate-500">{fund.holderName}</p>
            <div className="mt-4 flex justify-between text-xs">
              <span className="text-slate-500">الرصيد المتبقي:</span>
              <span className="font-bold text-slate-800">{formatCurrency(fund.currentBalance)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};`
  },
  {
    path: 'views/FinanceExpensesView.tsx',
    category: 'finance',
    name: 'FinanceExpensesView.tsx',
    description: 'كود صفحة المصروفات، فواتير المشتريات، احتساب ضريبة القيمة المضافة 5% واعتمادات الصرف',
    code: `import React, { useState } from 'react';
import { dataStore } from '../../lib/storage';
import { ExpensesService } from '../../services/expenses.service';
import { Expense } from '../../types/domain';
import { formatCurrency, formatDate, EXPENSE_STATUS_CONFIG } from '../../lib/utils/format';
import { hasPermission } from '../../lib/rbac/permissions';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

export const FinanceExpensesView: React.FC<{ onOpenNewExpense: () => void }> = ({ onOpenNewExpense }) => {
  const expenses = ExpensesService.getAll();
  const currentUser = dataStore.getCurrentUser();
  const canApprove = hasPermission(currentUser.role, 'expenses', 'approve');

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm">سجل المصروفات وفواتير الشراء الميدانية</h3>
        <Button variant="primary" size="sm" onClick={onOpenNewExpense}>
          + تسجيل مصروف جديد
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">المورد والبيان</th>
                <th className="p-3">المبلغ الصافي</th>
                <th className="p-3">الضريبة (5%)</th>
                <th className="p-3">الإجمالي</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-indigo-600">{exp.code}</td>
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{exp.vendorName}</span>
                    <span className="text-slate-500 text-[11px]">{exp.description}</span>
                  </td>
                  <td className="p-3 font-mono">{formatCurrency(exp.amount)}</td>
                  <td className="p-3 font-mono text-slate-500">{formatCurrency(exp.taxAmount)}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">{formatCurrency(exp.totalWithTax)}</td>
                  <td className="p-3 font-bold">{exp.status}</td>
                  <td className="p-3 text-center">
                    {canApprove && exp.status === 'pending_approval' && (
                      <button
                        onClick={() => ExpensesService.approve(exp.id)}
                        className="text-xs text-emerald-700 font-bold hover:underline"
                      >
                        اعتماد
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};`
  },
  {
    path: 'views/FinanceSettlementsView.tsx',
    category: 'finance',
    name: 'FinanceSettlementsView.tsx',
    description: 'كود صفحة التسويات المالية وإقفال العهد وطباعة سندات التصفية الرسمية المعتمَدة',
    code: `import React, { useState } from 'react';
import { dataStore } from '../../lib/storage';
import { SettlementsService } from '../../services/settlements.service';
import { Settlement } from '../../types/domain';
import { formatCurrency, formatDate, SETTLEMENT_STATUS_CONFIG } from '../../lib/utils/format';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

export const FinanceSettlementsView: React.FC = () => {
  const settlements = SettlementsService.getAll();

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900">دورات التسوية وتصفية العهد</h3>
          <p className="text-xs text-slate-500">مطابقة الفواتير وإقفال السلف النقدية وإصدار السندات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {settlements.map((s) => (
          <Card key={s.id} className="p-4 border-slate-200">
            <span className="font-mono font-bold text-xs text-indigo-600">{s.code}</span>
            <h4 className="font-extrabold text-sm text-slate-900 mt-2">{s.fundName}</h4>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[11px]">المنصرف</span>
                <span className="font-bold text-slate-800">{formatCurrency(s.totalExpenses)}</span>
              </div>
              <div>
                <span className="text-emerald-600 block text-[11px]">المسترد للخزينة</span>
                <span className="font-bold text-emerald-800">{formatCurrency(s.remainingAmount)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};`
  },
  {
    path: 'rbac/permissions.ts',
    category: 'admin',
    name: 'permissions.ts',
    description: 'كود مصفوفة الصلاحيات وأدوار المستخدمين RBAC (Admin, Ops, Finance, Field, Viewer)',
    code: `import { Role } from '../../types/domain';

export const ROLE_PERMISSIONS: Record<Role, Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean }>> = {
  admin: {
    dashboard: { view: true, create: true, edit: true, delete: true, approve: true },
    tasks: { view: true, create: true, edit: true, delete: true, approve: true },
    funds: { view: true, create: true, edit: true, delete: true, approve: true },
    expenses: { view: true, create: true, edit: true, delete: true, approve: true },
    settlements: { view: true, create: true, edit: true, delete: true, approve: true },
    reports: { view: true, create: true, edit: true, delete: true, approve: true },
    users: { view: true, create: true, edit: true, delete: true, approve: true },
    roles: { view: true, create: true, edit: true, delete: true, approve: true },
    audit: { view: true, create: false, edit: false, delete: false, approve: false },
    settings: { view: true, create: true, edit: true, delete: true, approve: true },
  },
  ops_manager: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
    tasks: { view: true, create: true, edit: true, delete: true, approve: true },
    funds: { view: true, create: false, edit: false, delete: false, approve: false },
    expenses: { view: true, create: true, edit: true, delete: false, approve: false },
    settlements: { view: true, create: false, edit: false, delete: false, approve: false },
    reports: { view: true, create: true, edit: false, delete: false, approve: false },
    users: { view: true, create: false, edit: false, delete: false, approve: false },
    roles: { view: true, create: false, edit: false, delete: false, approve: false },
    audit: { view: true, create: false, edit: false, delete: false, approve: false },
    settings: { view: false, create: false, edit: false, delete: false, approve: false },
  },
  finance_officer: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
    tasks: { view: true, create: false, edit: false, delete: false, approve: false },
    funds: { view: true, create: true, edit: true, delete: false, approve: true },
    expenses: { view: true, create: true, edit: true, delete: true, approve: true },
    settlements: { view: true, create: true, edit: true, delete: false, approve: true },
    reports: { view: true, create: true, edit: true, delete: false, approve: true },
    users: { view: false, create: false, edit: false, delete: false, approve: false },
    roles: { view: false, create: false, edit: false, delete: false, approve: false },
    audit: { view: true, create: false, edit: false, delete: false, approve: false },
    settings: { view: true, create: false, edit: true, delete: false, approve: false },
  },
  field_officer: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
    tasks: { view: true, create: false, edit: true, delete: false, approve: false },
    funds: { view: true, create: false, edit: false, delete: false, approve: false },
    expenses: { view: true, create: true, edit: false, delete: false, approve: false },
    settlements: { view: true, create: false, edit: false, delete: false, approve: false },
    reports: { view: false, create: false, edit: false, delete: false, approve: false },
    users: { view: false, create: false, edit: false, delete: false, approve: false },
    roles: { view: false, create: false, edit: false, delete: false, approve: false },
    audit: { view: false, create: false, edit: false, delete: false, approve: false },
    settings: { view: false, create: false, edit: false, delete: false, approve: false },
  },
  viewer: {
    dashboard: { view: true, create: false, edit: false, delete: false, approve: false },
    tasks: { view: true, create: false, edit: false, delete: false, approve: false },
    funds: { view: true, create: false, edit: false, delete: false, approve: false },
    expenses: { view: true, create: false, edit: false, delete: false, approve: false },
    settlements: { view: true, create: false, edit: false, delete: false, approve: false },
    reports: { view: true, create: false, edit: false, delete: false, approve: false },
    users: { view: false, create: false, edit: false, delete: false, approve: false },
    roles: { view: false, create: false, edit: false, delete: false, approve: false },
    audit: { view: false, create: false, edit: false, delete: false, approve: false },
    settings: { view: false, create: false, edit: false, delete: false, approve: false },
  },
};`
  }
];
