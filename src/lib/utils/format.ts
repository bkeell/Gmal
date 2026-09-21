import { TaskPriority, TaskStatus, ExpenseCategory, ExpenseStatus, SettlementStatus, FundStatus } from '../../types/domain';

export function formatCurrency(amount: number, currency: string = 'AED'): string {
  return new Intl.NumberFormat('ar-AE', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-AE').format(num);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('ar-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('ar-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'جديدة', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
  scheduled: { label: 'مجدولة', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  todo: { label: 'قيد الانتظار', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
  started: { label: 'بدأ التنفيذ', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  in_progress: { label: 'جاري التنفيذ', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  paused: { label: 'متوقفة مؤقتاً', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  review: { label: 'قيد المراجعة', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  pending_approval: { label: 'بانتظار الاعتماد', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  approved: { label: 'معتمدة', color: 'text-emerald-800', bg: 'bg-emerald-100 border-emerald-300' },
  rejected: { label: 'مرفوضة من المشرف', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  completed: { label: 'مكتملة بنجاح', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  deferred: { label: 'مؤجلة / متابعة', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  cancelled: { label: 'ملغاة', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; dotColor: string }> = {
  urgent: { label: 'حرجة / عاجلة', color: 'bg-rose-50 text-rose-700 border-rose-200', dotColor: 'bg-rose-500' },
  high: { label: 'أولوية مرتفعة', color: 'bg-orange-50 text-orange-700 border-orange-200', dotColor: 'bg-orange-500' },
  medium: { label: 'متوسطة', color: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
  low: { label: 'عادية / منخفضة', color: 'bg-slate-50 text-slate-700 border-slate-200', dotColor: 'bg-slate-400' },
};

export const EXPENSE_CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; iconName: string }> = {
  transport: { label: 'نقل وتنقلات', iconName: 'Truck' },
  materials: { label: 'مواد ومستلزمات', iconName: 'Package' },
  hospitality: { label: 'ضيافة واستقبال', iconName: 'Coffee' },
  maintenance: { label: 'صيانة وتشغيل', iconName: 'Wrench' },
  government: { label: 'رسوم حكومية وتراخيص', iconName: 'Building' },
  fuel: { label: 'وقود ومحروقات', iconName: 'Fuel' },
  tools: { label: 'أجهزة ومعدات', iconName: 'Tool' },
  other: { label: 'مصروفات متنوعة', iconName: 'Tag' },
};

export const EXPENSE_STATUS_CONFIG: Record<ExpenseStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'مسودة', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
  pending_approval: { label: 'بانتظار الاعتماد', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  approved: { label: 'معتمد للصرف', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  rejected: { label: 'مرفوض', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  settled: { label: 'تمت التسوية', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
};

export const SETTLEMENT_STATUS_CONFIG: Record<SettlementStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'مسودة تسوية', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
  under_review: { label: 'قيد التدقيق المالي', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  audited: { label: 'تمت المطابقة', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  approved: { label: 'معتمدة ومقفلة', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  closed: { label: 'مغلقة ومؤرشفة', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

export const FUND_STATUS_CONFIG: Record<FundStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'نشط ومستقر', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  warning: { label: 'قارب على النفاد', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  depleted: { label: 'منفد / بحاجة تزويد', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  closed: { label: 'مقفل ومسوّى', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
};
