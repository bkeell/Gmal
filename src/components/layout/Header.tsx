import React, { useState } from 'react';
import {
  Bell,
  Code2,
  Menu,
  Plus,
  Shield,
  UserCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { User, Role } from '../../types/domain';
import { ROLE_LABELS } from '../../lib/rbac/permissions';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface HeaderProps {
  currentUser: User;
  onOpenMobileMenu: () => void;
  onOpenNewTask: () => void;
  onOpenNewExpense: () => void;
  onSelectView: (view: string) => void;
  currentView: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenMobileMenu,
  onOpenNewTask,
  onOpenNewExpense,
  onSelectView,
  currentView,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const notifications = dataStore.getNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const users = dataStore.getUsers();

  const handleSwitchUser = (userId: string) => {
    dataStore.switchUser(userId);
    setShowRoleDropdown(false);
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'daily': return { title: 'لوحة اليوم الموحدة (Daily Command Center)', sub: 'متابعة المهام الميدانية اللحظية، الإنجاز، والتنبيهات المباشرة' };
      case 'approvals': return { title: 'مركز الاعتمادات والرقابة الإشرافية', sub: 'مراجعة وتدقيق مهام الموظفين، فواتير المصروفات، وإقفال العهد' };
      case 'dashboard': return { title: 'لوحة التحكم المركزية', sub: 'نظرة عامة على العمليات والمؤشرات المالية الحية' };
      case 'tasks': return { title: 'إدارة المهام الميدانية', sub: 'متابعة مراحل التنفيذ، التكاليف وفريق العمل' };
      case 'followUps': return { title: 'المتابعات والمهام الحرجة', sub: 'رصد المواعيد النهائية والزيارات الرقابية' };
      case 'funds': return { title: 'صناديق العهد النقدية (Petty Cash)', sub: 'إدارة وتخصيص الأرصدة وتتبع نسب الاستهلاك' };
      case 'expenses': return { title: 'المصروفات والفواتير الميدانية', sub: 'تدقيق المستندات، احتساب الضريبة، واعتمادات الصرف' };
      case 'settlements': return { title: 'التسويات المالية وإقفال العهد', sub: 'مطابقة الفواتير مع السلف وإصدار سندات التصفية' };
      case 'calendar': return { title: 'التقويم التشغيلي والزيارات', sub: 'الجدول الزمني لتسليم المهام ومواعيد التدقيق' };
      case 'reports': return { title: 'التقارير ومؤشرات الأداء (KPIs)', sub: 'تحليلات الإنفاق المالي وكفاءة الفرق الميدانية' };
      case 'team': return { title: 'فريق العمل والمهندسين', sub: 'سجل الموظفين والمشرفين وتوزيع الأعباء' };
      case 'users': return { title: 'إدارة مستخدمي النظام', sub: 'حسابات الدخول وتعيين الأدوار الوظيفية' };
      case 'roles': return { title: 'مصفوفة الصلاحيات (RBAC)', sub: 'صلاحيات الإشراف، الاعتماد، والتعديل' };
      case 'audit': return { title: 'سجل التدقيق والرقابة الأمني', sub: 'تتبع كافة الحركات والعمليات المالية والميدانية' };
      case 'settings': return { title: 'إعدادات النظام العامة', sub: 'العملة، حدود الصرف، وتنبيهات السيولة' };
      case 'codeViewer': return { title: 'مستودع أكواد الصفحات بالكامل', sub: 'استعراض ونسخ الأكواد المصدرية لكافة الملفات' };
      default: return { title: 'منصة العمليات والمالية', sub: 'OpsPlatform' };
    }
  };

  const viewInfo = getViewTitle();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition-all">
      {/* Left (in RTL: Right side) Title & Mobile Trigger */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
          title="فتح القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
            {viewInfo.title}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block truncate">
            {viewInfo.sub}
          </p>
        </div>
      </div>

      {/* Right Controls (Actions, Role Switcher, Notifications, Code Button) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenNewExpense}
            icon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
            className="text-xs border-emerald-200 hover:bg-emerald-50 text-emerald-800"
          >
            إضافة مصروف
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewTask}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            مهمة جديدة
          </Button>
        </div>

        {/* Full Code Viewer Toggle Button */}
        <button
          onClick={() => onSelectView('codeViewer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
            currentView === 'codeViewer'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-indigo-50/80 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
          }`}
          title="عرض ونسخ الأكواد المصدرية لكافة الصفحات"
        >
          <Code2 className="w-4 h-4" />
          <span className="hidden sm:inline">أكواد الصفحات</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowRoleDropdown(false);
            }}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="الإشعارات"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">التنبيهات والإشعارات</span>
                  {unreadCount > 0 && (
                    <Badge variant="danger" size="sm">
                      {unreadCount} جديدة
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dataStore.markAllNotificationsRead()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      dataStore.markNotificationRead(notif.id);
                      if (notif.targetView) onSelectView(notif.targetView);
                      setShowNotifDropdown(false);
                    }}
                    className={`p-3 rounded-xl transition cursor-pointer border ${
                      notif.isRead
                        ? 'bg-white border-slate-100 text-slate-600'
                        : 'bg-indigo-50/40 border-indigo-100 text-slate-900 font-medium'
                    } hover:bg-slate-50`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : notif.type === 'alert' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                        ) : notif.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold truncate">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{notif.createdAt}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Role Quick Switcher Badge */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleDropdown(!showRoleDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
            title="تبديل المستخدم والدور الوظيفي"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-300"
            />
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-indigo-600 font-medium block">
                {currentUser.roleTitleAr}
              </span>
            </div>
            <Shield className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Switch User Dropdown */}
          {showRoleDropdown && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2 py-1.5 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-700 block">تبديل دور المستخدم (RBAC)</span>
                <span className="text-[11px] text-slate-400">اختر موظفاً لتجربة الصلاحيات المختلفة</span>
              </div>
              <div className="space-y-1">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const roleCfg = ROLE_LABELS[u.role];
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSwitchUser(u.id)}
                      className={`w-full text-right p-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isCurrent ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {u.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{u.roleTitleAr}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${roleCfg.badgeColor}`}>
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
