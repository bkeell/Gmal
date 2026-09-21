import React, { useState, useEffect } from 'react';
import { dataStore } from './lib/storage';
import { User } from './types/domain';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { DailyCommandCenterView } from './components/views/DailyCommandCenterView';
import { TasksView } from './components/views/TasksView';
import { FollowUpsView } from './components/views/FollowUpsView';
import { FinanceFundsView } from './components/views/FinanceFundsView';
import { FinanceExpensesView } from './components/views/FinanceExpensesView';
import { FinanceSettlementsView } from './components/views/FinanceSettlementsView';
import { CalendarView } from './components/views/CalendarView';
import { ReportsView } from './components/views/ReportsView';
import { TeamView } from './components/views/TeamView';
import { AdminUsersView } from './components/views/AdminUsersView';
import { AdminRolesView } from './components/views/AdminRolesView';
import { AdminAuditView } from './components/views/AdminAuditView';
import { SettingsView } from './components/views/SettingsView';
import { ApprovalsView } from './components/views/ApprovalsView';
import { CodeRepositoryViewer } from './components/code/CodeRepositoryViewer';
import { NewTaskModal } from './components/modals/NewTaskModal';
import { NewExpenseModal } from './components/modals/NewExpenseModal';
import { GlobalQuickActionFab } from './components/layout/GlobalQuickActionFab';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('daily');
  const [currentUser, setCurrentUser] = useState<User>(dataStore.getCurrentUser());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);

  // Subscribe to data store updates
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setCurrentUser({ ...dataStore.getCurrentUser() });
    });
    return unsubscribe;
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'daily':
        return (
          <DailyCommandCenterView
            onSelectView={setCurrentView}
            onOpenNewTask={() => setIsNewTaskOpen(true)}
          />
        );
      case 'approvals':
        return <ApprovalsView onSelectView={setCurrentView} />;
      case 'dashboard':
        return (
          <DashboardView
            onSelectView={setCurrentView}
            onOpenNewTask={() => setIsNewTaskOpen(true)}
            onOpenNewExpense={() => setIsNewExpenseOpen(true)}
          />
        );
      case 'tasks':
        return <TasksView onOpenNewTask={() => setIsNewTaskOpen(true)} />;
      case 'followUps':
        return (
          <FollowUpsView
            onSelectView={setCurrentView}
            onOpenNewTask={() => setIsNewTaskOpen(true)}
          />
        );
      case 'funds':
        return <FinanceFundsView />;
      case 'expenses':
        return <FinanceExpensesView onOpenNewExpense={() => setIsNewExpenseOpen(true)} />;
      case 'settlements':
        return <FinanceSettlementsView />;
      case 'calendar':
        return (
          <CalendarView
            onOpenNewTask={() => setIsNewTaskOpen(true)}
            onSelectView={setCurrentView}
          />
        );
      case 'reports':
        return <ReportsView />;
      case 'team':
        return <TeamView onSelectView={setCurrentView} />;
      case 'users':
        return <AdminUsersView />;
      case 'roles':
        return <AdminRolesView />;
      case 'audit':
        return <AdminAuditView />;
      case 'settings':
        return <SettingsView onSelectView={setCurrentView} />;
      case 'codeViewer':
        return <CodeRepositoryViewer onBackToDashboard={() => setCurrentView('dashboard')} />;
      default:
        return (
          <DashboardView
            onSelectView={setCurrentView}
            onOpenNewTask={() => setIsNewTaskOpen(true)}
            onOpenNewExpense={() => setIsNewExpenseOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex font-sans antialiased selection:bg-indigo-500 selection:text-white" dir="rtl">
      {/* Persistent Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        currentUser={currentUser}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Sticky Header */}
        <Header
          currentUser={currentUser}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewTask={() => setIsNewTaskOpen(true)}
          onOpenNewExpense={() => setIsNewExpenseOpen(true)}
          onSelectView={setCurrentView}
          currentView={currentView}
        />

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
      />

      <NewExpenseModal
        isOpen={isNewExpenseOpen}
        onClose={() => setIsNewExpenseOpen(false)}
      />

      {/* Persistent Global Floating Action Button */}
      <GlobalQuickActionFab
        onOpenNewTask={() => setIsNewTaskOpen(true)}
        onOpenNewExpense={() => setIsNewExpenseOpen(true)}
        onSelectView={setCurrentView}
      />
    </div>
  );
}
