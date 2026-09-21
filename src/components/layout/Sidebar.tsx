import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Wallet,
  Receipt,
  FileCheck2,
  Calendar,
  BarChart3,
  Users,
  Shield,
  History,
  Settings,
  Code2,
  Sparkles,
  RefreshCw,
  X,
  Layers,
  Target,
} from 'lucide-react';
import { User } from '../../types/domain';
import { hasPermission } from '../../lib/rbac/permissions';
import { dataStore } from '../../lib/storage';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  currentUser: User;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  currentUser,
  isOpenMobile,
  onCloseMobile,
}) => {
  const tasks = dataStore.getTasks();
  const pendingTasksCount = tasks.filter((t) => t.status === 'in_progress' || t.status === 'todo').length;

  const expenses = dataStore.getExpenses();
  const pendingExpensesCount = expenses.filter((e) => e.status === 'pending_approval').length;

  const funds = dataStore.getFunds();
  const warningFundsCount = funds.filter((f) => f.status === 'warning' || f.status === 'depleted').length;

  const settlements = dataStore.getSettlements();
  const pendingApprovalsCount =
    tasks.filter((t) => t.status === 'pending_approval').length +
    expenses.filter((e) => e.status === 'pending_approval').length +
    settlements.filter((s) => s.status === 'under_review').length;

  const navGroups = [
    {
      title: 'العمليات والتشغيل',
      items: [
        {
          id: 'daily',
          label: 'لوحة اليوم (Daily Center)',
          icon: Target,
          badge: 'اليوم',
          badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
          module: 'dashboard',
        },
        {
          id: 'approvals',
          label: 'مركز الاعتمادات والموافقات',
          icon: FileCheck2,
          badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined,
          badgeColor: 'bg-purple-100 text-purple-800 font-bold',
          module: 'tasks',
        },
        {
          id: 'dashboard',
          label: 'لوحة التحكم العامة',
          icon: LayoutDashboard,
          module: 'dashboard',
        },
        {
          id: 'tasks',
          label: 'المهام الميدانية',
          icon: CheckSquare,
          badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : undefined,
          badgeColor: 'bg-blue-100 text-blue-700',
          module: 'tasks',
        },
        {
          id: 'followUps',
          label: 'المتابعات والحرجة',
          icon: Clock,
          module: 'followUps',
        },
        {
          id: 'calendar',
          label: 'التقويم التشغيلي',
          icon: Calendar,
          module: 'calendar',
        },
      ],
    },
    {
      title: 'الإدارة المالية والعهد',
      items: [
        {
          id: 'funds',
          label: 'صناديق العهد النقدية',
          icon: Wallet,
          badge: warningFundsCount > 0 ? `${warningFundsCount} تنبيه` : undefined,
          badgeColor: 'bg-amber-100 text-amber-800',
          module: 'funds',
        },
        {
          id: 'expenses',
          label: 'المصروفات والفواتير',
          icon: Receipt,
          badge: pendingExpensesCount > 0 ? `${pendingExpensesCount}` : undefined,
          badgeColor: 'bg-emerald-100 text-emerald-800',
          module: 'expenses',
        },
        {
          id: 'settlements',
          label: 'التسويات وإقفال العهد',
          icon: FileCheck2,
          module: 'settlements',
        },
        {
          id: 'reports',
          label: 'التقارير ومؤشرات الأداء',
          icon: BarChart3,
          module: 'reports',
        },
      ],
    },
    {
      title: 'فريق العمل والإدارة',
      items: [
        {
          id: 'team',
          label: 'فريق العمل الميداني',
          icon: Users,
          module: 'team',
        },
        {
          id: 'users',
          label: 'إدارة المستخدمين',
          icon: Users,
          module: 'users',
        },
        {
          id: 'roles',
          label: 'مصفوفة الصلاحيات RBAC',
          icon: Shield,
          module: 'roles',
        },
        {
          id: 'audit',
          label: 'سجل التدقيق الأمني',
          icon: History,
          module: 'audit',
        },
        {
          id: 'settings',
          label: 'إعدادات المنظومة',
          icon: Settings,
          module: 'settings',
        },
      ],
    },
  ];

  const handleSelect = (viewId: string) => {
    onSelectView(viewId);
    onCloseMobile();
  };

  const handleResetData = () => {
    if (window.confirm('هل تريد إعادة تعيين البيانات إلى الحالة الأولية النموذجية؟')) {
      dataStore.resetToDefault();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 bg-slate-900 text-slate-200 flex flex-col border-l border-slate-800/80 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-base tracking-tight">OpsPlatform</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-400/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">إدارة العمليات والعهد النقدية</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
                {group.title}
              </p>
              {group.items.map((item) => {
                // Check RBAC permission for viewing
                const canView = hasPermission(currentUser.role, item.module, 'view');
                const isSelected = currentView === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    disabled={!canView}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30 font-bold'
                        : canView
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-600 cursor-not-allowed opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Dedicated Section for Page Codes */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => handleSelect('codeViewer')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                currentView === 'codeViewer'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-emerald-400 hover:bg-emerald-950/40 border border-emerald-500/20'
              }`}
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>أكواد الصفحات بالكامل</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>النسخة v2.4.0 (Enterprise)</span>
            <button
              onClick={handleResetData}
              className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
              title="إعادة تعيين البيانات الافتراضية"
            >
              <RefreshCw className="w-3 h-3" />
              <span>تهيئة البيانات</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
