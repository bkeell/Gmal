import { User, Task, PettyCashFund, Expense, Settlement, FollowUp, AuditLog, NotificationItem, Role, TaskStatus, ExpenseStatus, TaskOutcome, TaskOutcomeReason, TaskChainNode, TaskAttachment, TaskComment } from '../types/domain';
import { INITIAL_USERS, INITIAL_FUNDS, INITIAL_EXPENSES, INITIAL_TASKS, INITIAL_SETTLEMENTS, INITIAL_FOLLOW_UPS, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS } from './mockData';

export interface SystemSettings {
  // الهوية والمنشأة
  appName: string;
  organizationName: string;
  taxRegistrationNumber: string;
  headquarters: string;
  supportEmail: string;
  supportPhone: string;

  // السياسات المالية والرقابة
  currency: string;
  taxRate: number; // e.g. 5%
  singleExpenseLimit: number; // e.g. 5000 AED
  fundWarningThresholdPercent: number; // e.g. 30%
  autoNotifyOnLowBalance: boolean;
  requireReceiptForExpense: boolean;
  requireInvoiceNumber: boolean;
  requireDualApprovalForSettlements: boolean;
  fiscalYearStartMonth: number; // 1 = January

  // المهام والتشغيل الميداني
  defaultTaskDurationDays: number;
  requireFundForTaskExpenses: boolean;
  budgetOverrunTolerancePercent: number; // e.g. 10%
  autoFollowUpReminderHours: number; // e.g. 24
  allowOfflineTaskSync: boolean;

  // الإشعارات والتنبيهات
  notifyOnUrgentTask: boolean;
  notifyOnExpenseRejected: boolean;
  notifyOnFundReplenished: boolean;
  notifyOnSettlementDue: boolean;
  enableSoundAlerts: boolean;

  // التنسيقات والواجهة
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormatting: 'standard' | 'compact';
  themeAccent: 'indigo' | 'emerald' | 'blue' | 'purple' | 'amber';
}

const DEFAULT_SETTINGS: SystemSettings = {
  appName: 'منظومة إدارة العمليات والعهد النقدية',
  organizationName: 'مجموعة الصقر لإدارة العمليات والمشاريع',
  taxRegistrationNumber: '100234567800003',
  headquarters: 'أبوظبي، دولة الإمارات العربية المتحدة',
  supportEmail: 'ops-support@al-saqr.ae',
  supportPhone: '+971 2 600 5000',

  currency: 'AED',
  taxRate: 5,
  singleExpenseLimit: 5000,
  fundWarningThresholdPercent: 30,
  autoNotifyOnLowBalance: true,
  requireReceiptForExpense: true,
  requireInvoiceNumber: true,
  requireDualApprovalForSettlements: true,
  fiscalYearStartMonth: 1,

  defaultTaskDurationDays: 7,
  requireFundForTaskExpenses: true,
  budgetOverrunTolerancePercent: 10,
  autoFollowUpReminderHours: 24,
  allowOfflineTaskSync: true,

  notifyOnUrgentTask: true,
  notifyOnExpenseRejected: true,
  notifyOnFundReplenished: true,
  notifyOnSettlementDue: true,
  enableSoundAlerts: false,

  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  numberFormatting: 'standard',
  themeAccent: 'indigo',
};

const STORAGE_KEYS = {
  USERS: 'ops_users_v3',
  CURRENT_USER_ID: 'ops_current_user_id_v3',
  FUNDS: 'ops_funds_v3',
  EXPENSES: 'ops_expenses_v3',
  TASKS: 'ops_tasks_v3',
  SETTLEMENTS: 'ops_settlements_v3',
  FOLLOW_UPS: 'ops_follow_ups_v3',
  AUDIT_LOGS: 'ops_audit_logs_v3',
  NOTIFICATIONS: 'ops_notifications_v3',
  SETTINGS: 'ops_settings_v3',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to persist key ${key}:`, e);
  }
}

export class OpsDataStore {
  private static instance: OpsDataStore;

  private users: User[];
  private currentUserId: string;
  private funds: PettyCashFund[];
  private expenses: Expense[];
  private tasks: Task[];
  private settlements: Settlement[];
  private followUps: FollowUp[];
  private auditLogs: AuditLog[];
  private notifications: NotificationItem[];
  private settings: SystemSettings;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.users = safeGet(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.currentUserId = safeGet(STORAGE_KEYS.CURRENT_USER_ID, 'usr-1');
    this.funds = safeGet(STORAGE_KEYS.FUNDS, INITIAL_FUNDS);
    this.expenses = safeGet(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    this.tasks = safeGet(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    this.settlements = safeGet(STORAGE_KEYS.SETTLEMENTS, INITIAL_SETTLEMENTS);
    this.followUps = safeGet(STORAGE_KEYS.FOLLOW_UPS, INITIAL_FOLLOW_UPS);
    this.auditLogs = safeGet(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    this.notifications = safeGet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const savedSettings = safeGet<Partial<SystemSettings>>(STORAGE_KEYS.SETTINGS, {});
    this.settings = { ...DEFAULT_SETTINGS, ...savedSettings };
  }

  public static getInstance(): OpsDataStore {
    if (!OpsDataStore.instance) {
      OpsDataStore.instance = new OpsDataStore();
    }
    return OpsDataStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  // --- Users & Auth ---
  public getUsers(): User[] {
    return [...this.users];
  }

  public getCurrentUser(): User {
    const found = this.users.find((u) => u.id === this.currentUserId);
    return found || this.users[0];
  }

  public switchUser(userId: string): void {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.currentUserId = userId;
      safeSet(STORAGE_KEYS.CURRENT_USER_ID, userId);
      this.logAudit('تبديل المستخدم الحالي', 'auth', 'user', userId, `تسجيل الدخول بدور: ${user.roleTitleAr}`);
      this.notify();
    }
  }

  public addUser(user: Omit<User, 'id'>): User {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
    };
    this.users = [newUser, ...this.users];
    safeSet(STORAGE_KEYS.USERS, this.users);
    this.logAudit('إضافة مستخدم جديد', 'create', 'user', newUser.id, `إضافة الموظف: ${newUser.name} بدور: ${newUser.roleTitleAr}`);
    this.notify();
    return newUser;
  }

  public toggleUserStatus(userId: string): void {
    this.users = this.users.map((u) => (u.id === userId ? { ...u, active: !u.active } : u));
    safeSet(STORAGE_KEYS.USERS, this.users);
    this.logAudit('تعديل حالة المستخدم', 'update', 'user', userId, `تغيير حالة تفعيل المستخدم`);
    this.notify();
  }

  // --- Funds ---
  public getFunds(): PettyCashFund[] {
    return [...this.funds];
  }

  public getFundById(id: string): PettyCashFund | undefined {
    return this.funds.find((f) => f.id === id);
  }

  public addFund(fund: Omit<PettyCashFund, 'id' | 'code' | 'spentBalance' | 'currentBalance' | 'status' | 'lastReplenishedDate'>): PettyCashFund {
    const newFund: PettyCashFund = {
      ...fund,
      id: `fund-${Date.now()}`,
      code: `PCF-2026-0${this.funds.length + 1}`,
      currentBalance: fund.totalAllocation,
      spentBalance: 0,
      status: 'active',
      lastReplenishedDate: new Date().toISOString().split('T')[0],
    };
    this.funds = [newFund, ...this.funds];
    safeSet(STORAGE_KEYS.FUNDS, this.funds);
    this.logAudit('تخصيص عهدة نقدية جديدة', 'create', 'fund', newFund.id, `عهدة ${newFund.name} بمبلغ ${newFund.totalAllocation} ${newFund.currency} لـ ${newFund.holderName}`);
    this.notify();
    return newFund;
  }

  public replenishFund(fundId: string, addedAmount: number, notes?: string): void {
    this.funds = this.funds.map((f) => {
      if (f.id === fundId) {
        const newBalance = f.currentBalance + addedAmount;
        const newStatus = newBalance <= 0 ? 'depleted' : (newBalance / f.totalAllocation) * 100 <= f.warningThreshold ? 'warning' : 'active';
        return {
          ...f,
          currentBalance: newBalance,
          status: newStatus,
          lastReplenishedDate: new Date().toISOString().split('T')[0],
          notes: notes ? `${f.notes ? f.notes + ' | ' : ''}تغذية رصيد بمبلغ ${addedAmount}: ${notes}` : f.notes,
        };
      }
      return f;
    });
    safeSet(STORAGE_KEYS.FUNDS, this.funds);
    this.logAudit('تغذية رصيد عهدة نقدية', 'update', 'fund', fundId, `إضافة مبلغ ${addedAmount} ${this.settings.currency} للرصيد.`);
    this.notify();
  }

  // --- Expenses ---
  public getExpenses(): Expense[] {
    return [...this.expenses];
  }

  public addExpense(expenseData: Omit<Expense, 'id' | 'code' | 'taxAmount' | 'totalWithTax' | 'status' | 'submittedAt' | 'submittedBy'>): Expense {
    const taxRate = this.settings.taxRate / 100;
    const taxAmount = Number((expenseData.amount * taxRate).toFixed(2));
    const totalWithTax = Number((expenseData.amount + taxAmount).toFixed(2));
    const currentUser = this.getCurrentUser();

    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      code: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      taxAmount,
      totalWithTax,
      status: 'pending_approval',
      submittedAt: new Date().toLocaleString('ar-AE'),
      submittedBy: currentUser.name,
    };

    this.expenses = [newExpense, ...this.expenses];
    safeSet(STORAGE_KEYS.EXPENSES, this.expenses);

    // If linked to fund, deduct from current balance and add to spent
    this.funds = this.funds.map((f) => {
      if (f.id === newExpense.fundId) {
        const newBalance = Math.max(0, f.currentBalance - totalWithTax);
        const newSpent = f.spentBalance + totalWithTax;
        const percent = (newBalance / f.totalAllocation) * 100;
        const status = newBalance <= 0 ? 'depleted' : percent <= f.warningThreshold ? 'warning' : 'active';
        return {
          ...f,
          currentBalance: newBalance,
          spentBalance: newSpent,
          status,
        };
      }
      return f;
    });
    safeSet(STORAGE_KEYS.FUNDS, this.funds);

    this.logAudit('تسجيل مصروف عهدة جديد', 'create', 'expense', newExpense.id, `فاتورة ${newExpense.invoiceNumber} بمبلغ ${totalWithTax} لـ ${newExpense.vendorName}`);
    this.addNotification({
      title: 'طلب اعتماد مصروف جديد',
      message: `${currentUser.name} أضاف مصروفاً بقيمة ${totalWithTax} ${this.settings.currency} من ${newExpense.fundName}.`,
      type: 'info',
      targetView: 'expenses',
    });

    this.notify();
    return newExpense;
  }

  public updateExpenseStatus(expenseId: string, status: ExpenseStatus, reason?: string): void {
    const currentUser = this.getCurrentUser();
    let affectedFundId = '';
    let refundAmount = 0;

    this.expenses = this.expenses.map((e) => {
      if (e.id === expenseId) {
        affectedFundId = e.fundId;
        if (status === 'rejected' && e.status !== 'rejected') {
          refundAmount = e.totalWithTax;
        }
        return {
          ...e,
          status,
          approvedBy: status === 'approved' ? currentUser.name : e.approvedBy,
          approvedAt: status === 'approved' ? new Date().toLocaleString('ar-AE') : e.approvedAt,
          rejectionReason: status === 'rejected' ? reason : undefined,
        };
      }
      return e;
    });
    safeSet(STORAGE_KEYS.EXPENSES, this.expenses);

    // If rejected, return money back to fund balance!
    if (refundAmount > 0 && affectedFundId) {
      this.funds = this.funds.map((f) => {
        if (f.id === affectedFundId) {
          const newBal = f.currentBalance + refundAmount;
          const newSpent = Math.max(0, f.spentBalance - refundAmount);
          return {
            ...f,
            currentBalance: newBal,
            spentBalance: newSpent,
            status: (newBal / f.totalAllocation) * 100 <= f.warningThreshold ? 'warning' : 'active',
          };
        }
        return f;
      });
      safeSet(STORAGE_KEYS.FUNDS, this.funds);
    }

    this.logAudit(
      status === 'approved' ? 'اعتماد مصروف' : status === 'rejected' ? 'رفض مصروف' : 'تحديث حالة المصروف',
      status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'update',
      'expense',
      expenseId,
      status === 'rejected' ? `السبب: ${reason}` : `تم الاعتماد بواسطة ${currentUser.name}`
    );
    this.notify();
  }

  // --- Tasks ---
  public getTasks(): Task[] {
    return [...this.tasks];
  }

  public addTask(taskData: Omit<Task, 'id' | 'spentAmount' | 'history' | 'createdAt'>): Task {
    const currentUser = this.getCurrentUser();
    const newTask: Task = {
      ...taskData,
      id: `tsk-${Date.now()}`,
      spentAmount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      history: [
        {
          id: `h-${Date.now()}`,
          action: `إنشاء المهمة وتعيينها لـ ${taskData.assigneeName}`,
          performedBy: currentUser.name,
          timestamp: new Date().toLocaleString('ar-AE'),
        }
      ],
    };

    this.tasks = [newTask, ...this.tasks];
    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('إنشاء مهمة ميدانية جديدة', 'create', 'task', newTask.id, `المهمة: ${newTask.title} في ${newTask.location}`);
    this.addNotification({
      title: 'مهمة جديدة مسندة',
      message: `تم تكليف ${newTask.assigneeName} بمهمة "${newTask.title}".`,
      type: 'info',
      targetView: 'tasks',
    });
    this.notify();
    return newTask;
  }

  public updateTaskStatus(taskId: string, status: TaskStatus): void {
    const currentUser = this.getCurrentUser();
    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status,
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `تحديث الحالة إلى: ${status}`,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ],
        };
      }
      return t;
    });
    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('تحديث حالة مهمة', 'update', 'task', taskId, `الحالة الجديدة: ${status}`);
    this.notify();
  }

  public toggleTaskChecklistItem(taskId: string, checklistItemId: string): void {
    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          checklist: t.checklist.map((c) => (c.id === checklistItemId ? { ...c, completed: !c.completed } : c)),
        };
      }
      return t;
    });
    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.notify();
  }

  public deleteTask(taskId: string): void {
    const t = this.tasks.find((task) => task.id === taskId);
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('حذف مهمة', 'delete', 'task', taskId, `تم حذف المهمة ${t?.title || taskId}`);
    this.notify();
  }

  public updateTaskDetails(taskId: string, updates: Partial<Task>): void {
    const currentUser = this.getCurrentUser();
    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          ...updates,
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `تحديث بيانات المهمة بواسطة ${currentUser.name}`,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
      }
      return t;
    });
    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.notify();
  }

  public rescheduleTask(taskId: string, newDueDate: string, reason?: string): void {
    const currentUser = this.getCurrentUser();
    let oldDueDate = '';
    let taskTitle = '';
    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        oldDueDate = t.dueDate;
        taskTitle = t.title;
        const actionDesc = reason
          ? `ترحيل المهمة من (${oldDueDate}) إلى (${newDueDate}) - السبب: ${reason}`
          : `ترحيل وجدولة المهمة من (${oldDueDate}) إلى (${newDueDate})`;
        return {
          ...t,
          dueDate: newDueDate,
          startDate: newDueDate,
          status: t.status === 'completed' || t.status === 'approved' ? t.status : 'scheduled',
          outcomeReason: reason || t.outcomeReason,
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: actionDesc,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            },
          ],
        };
      }
      return t;
    });
    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('ترحيل مهمة لتاريخ جديد', 'update', 'task', taskId, `ترحيل "${taskTitle}" من ${oldDueDate} إلى ${newDueDate}`);
    this.addNotification({
      title: 'تم ترحيل المهمة',
      message: `تم ترحيل موعد المهمة "${taskTitle}" إلى ${newDueDate}`,
      type: 'info',
      targetView: 'calendar',
    });
    this.notify();
  }

  public startTaskTimer(taskId: string): void {
    const currentUser = this.getCurrentUser();
    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus: TaskStatus = t.status === 'new' || t.status === 'scheduled' || t.status === 'todo' ? 'started' : t.status;
        return {
          ...t,
          status: nextStatus,
          isTimerRunning: true,
          timerStartedAt: new Date().toISOString(),
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `بدء عداد وقت التنفيذ الفعلي بواسطة ${currentUser.name}`,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
      }
      return t;
    });
    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('بدء تنفيذ مهمة', 'update', 'task', taskId, 'تم تشغيل مؤقت الإنجاز الميداني');
    this.notify();
  }

  public stopTaskTimer(taskId: string): void {
    const currentUser = this.getCurrentUser();
    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId && t.isTimerRunning && t.timerStartedAt) {
        const startedTime = new Date(t.timerStartedAt).getTime();
        const elapsedMinutes = Math.max(1, Math.round((Date.now() - startedTime) / 60000));
        const totalMinutes = (t.timeSpentMinutes || 0) + elapsedMinutes;
        return {
          ...t,
          isTimerRunning: false,
          timerStartedAt: undefined,
          timeSpentMinutes: totalMinutes,
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `إيقاف المؤقت (أضيف ${elapsedMinutes} دقيقة - الإجمالي: ${totalMinutes} دقيقة)`,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
      }
      return t;
    });
    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.notify();
  }

  public recordTaskOutcome(
    taskId: string,
    payload: {
      outcome: TaskOutcome;
      reason?: string;
      notes?: string;
      proofUrl?: string;
      followUp?: {
        title: string;
        dueDate: string;
        dueTime?: string;
        reason?: string;
        notes?: string;
        assigneeId?: string;
        assigneeName?: string;
      };
    }
  ): { updatedTask: Task; followUpTask?: Task } {
    const currentUser = this.getCurrentUser();
    let updatedTaskRef: Task | undefined;
    let followUpTaskRef: Task | undefined;

    // 1. If timer was running, compute final time
    let extraMinutes = 0;
    const existing = this.tasks.find((t) => t.id === taskId);
    if (existing?.isTimerRunning && existing.timerStartedAt) {
      extraMinutes = Math.max(1, Math.round((Date.now() - new Date(existing.timerStartedAt).getTime()) / 60000));
    }

    const outcomeLabels: Record<TaskOutcome, string> = {
      completed: 'تم الإنجاز بالكامل',
      partially_completed: 'تم الإنجاز جزئياً',
      not_completed: 'لم يتم الإنجاز',
      unable_to_execute: 'تعذر التنفيذ',
      needs_followup: 'يحتاج إلى متابعة تكميلية',
    };

    const isFullyDone = payload.outcome === 'completed';
    const targetStatus: TaskStatus = isFullyDone ? 'pending_approval' : 'deferred';

    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        const totalTime = (t.timeSpentMinutes || 0) + extraMinutes;
        const currentChain: TaskChainNode[] = t.taskChain || [
          {
            id: t.id,
            title: t.title,
            status: targetStatus,
            outcome: payload.outcome,
            outcomeReason: payload.reason,
            date: new Date().toISOString().split('T')[0],
            assigneeName: t.assigneeName,
          }
        ];

        const updated: Task = {
          ...t,
          status: targetStatus,
          outcome: payload.outcome,
          outcomeReason: payload.reason,
          outcomeNotes: payload.notes,
          outcomeSubmittedAt: new Date().toLocaleString('ar-AE'),
          proofAttachmentUrl: payload.proofUrl || t.proofAttachmentUrl,
          isTimerRunning: false,
          timerStartedAt: undefined,
          timeSpentMinutes: totalTime,
          taskChain: currentChain,
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `تسجيل نتيجة التنفيذ: ${outcomeLabels[payload.outcome]}${payload.reason ? ` (السبب: ${payload.reason})` : ''}`,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
        updatedTaskRef = updated;
        return updated;
      }
      return t;
    });

    // 2. If follow up task is requested, create it and link the task chain!
    if (payload.followUp && updatedTaskRef) {
      const parentTask = updatedTaskRef;
      const followUpAssigneeId = payload.followUp.assigneeId || parentTask.assigneeId;
      const followUpAssigneeName = payload.followUp.assigneeName || parentTask.assigneeName;

      const newFollowUpTask: Task = {
        id: `tsk-${Date.now()}-chain`,
        title: payload.followUp.title || `متابعة: ${parentTask.title}`,
        description: `مهمة متابعة ناتجة عن عدم اكتمال المهمة [${parentTask.title}]. السبب: ${payload.reason || payload.followUp.reason || 'متابعة ميدانية'}\n${payload.followUp.notes || ''}`,
        priority: parentTask.priority,
        status: 'scheduled',
        assigneeId: followUpAssigneeId,
        assigneeName: followUpAssigneeName,
        assigneeAvatar: parentTask.assigneeAvatar,
        dueDate: payload.followUp.dueDate || new Date().toISOString().split('T')[0],
        dueTime: payload.followUp.dueTime || '10:00',
        startDate: new Date().toISOString().split('T')[0],
        location: parentTask.location,
        mapsUrl: parentTask.mapsUrl,
        category: parentTask.category,
        taskType: 'متابعة تكميلية',
        clientName: parentTask.clientName,
        clientContact: parentTask.clientContact,
        clientPhone: parentTask.clientPhone,
        budget: Math.round(parentTask.budget * 0.5),
        spentAmount: 0,
        tags: [...parentTask.tags, 'متابعة-سلسلة'],
        checklist: [
          { id: `chk-${Date.now()}-1`, text: `معالجة العائق: ${payload.reason || 'التواصل المباشر مع العميل'}`, completed: false },
          { id: `chk-${Date.now()}-2`, text: 'إتمام الهدف المتبقي وتوثيق الإنجاز', completed: false },
        ],
        fundId: parentTask.fundId,
        createdAt: new Date().toISOString().split('T')[0],
        parentTaskId: parentTask.id,
        history: [
          {
            id: `h-${Date.now()}`,
            action: `إنشاء مهمة متابعة تلقائية متفرعة من المهمة [${parentTask.title}]`,
            performedBy: currentUser.name,
            timestamp: new Date().toLocaleString('ar-AE'),
          }
        ],
        taskChain: [
          ...(parentTask.taskChain || []),
          {
            id: `tsk-${Date.now()}-chain`,
            title: payload.followUp.title,
            status: 'scheduled',
            date: payload.followUp.dueDate,
            assigneeName: followUpAssigneeName,
          }
        ]
      };

      // Link chain in parent task
      this.tasks = this.tasks.map((t) => {
        if (t.id === parentTask.id) {
          return {
            ...t,
            chainFollowUpTaskId: newFollowUpTask.id,
            taskChain: newFollowUpTask.taskChain,
          };
        }
        return t;
      });

      this.tasks = [newFollowUpTask, ...this.tasks];
      followUpTaskRef = newFollowUpTask;

      // Also create a record in this.followUps for visibility in the legacy follow-ups view
      const newFollowUpRecord: FollowUp = {
        id: `flw-${Date.now()}`,
        taskId: parentTask.id,
        taskTitle: parentTask.title,
        title: payload.followUp.title,
        urgency: 'high',
        assignedTo: followUpAssigneeName,
        scheduledDate: payload.followUp.dueDate,
        status: 'pending',
        notes: `سبب المتابعة: ${payload.reason || 'مهمة تكميلية'}. ${payload.followUp.notes || ''}`,
      };
      this.followUps = [newFollowUpRecord, ...this.followUps];
      safeSet(STORAGE_KEYS.FOLLOW_UPS, this.followUps);

      this.addNotification({
        title: 'إنشاء مهمة متابعة تلقائية',
        message: `تم إنشاء مهمة المتابعة "${newFollowUpTask.title}" وتعيينها لـ ${followUpAssigneeName}.`,
        type: 'warning',
        targetView: 'daily',
      });
    }

    safeSet(STORAGE_KEYS.TASKS, this.tasks);

    this.logAudit(
      'تسجيل نتيجة مهمة',
      'update',
      'task',
      taskId,
      `النتيجة: ${outcomeLabels[payload.outcome]} - ${payload.reason ? `السبب: ${payload.reason}` : 'بدون ملاحظات'}`
    );

    this.addNotification({
      title: isFullyDone ? 'مهمة مكتملة بانتظار الاعتماد' : 'مهمة بحاجة إلى متابعة',
      message: `${currentUser.name} أنهى مهمة "${existing?.title}" بنتيجة: ${outcomeLabels[payload.outcome]}.`,
      type: isFullyDone ? 'success' : 'alert',
      targetView: 'daily',
    });

    this.notify();
    return { updatedTask: updatedTaskRef!, followUpTask: followUpTaskRef };
  }

  public nudgeTask(taskId: string, senderName: string, customMessage?: string): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const message = customMessage || `تذكير عاجل من ${senderName}: مهمة "${task.title}" قيد التنفيذ يرجى تحديث الإنجاز فوراً.`;

    this.addNotification({
      title: `نكز من الإدارة: ${senderName}`,
      message,
      type: 'warning',
      targetView: 'daily',
    });

    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `إرسال نكز وتذكير عاجل بواسطة ${senderName}`,
              performedBy: senderName,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
      }
      return t;
    });

    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('نكز وتنبيه فوري لمهمة', 'update', 'task', taskId, message);
    this.notify();
  }

  public requestTaskHelp(taskId: string, senderName: string, department: string, reason: string): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const message = `طلب مساعدة عاجل من ${senderName} في مهمة "${task.title}": [${department}] ${reason}`;

    this.addNotification({
      title: `طلب مساعدة ميداني (SOS)`,
      message,
      type: 'alert',
      targetView: 'daily',
    });

    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `طلب مساعدة وتدخل إداري: ${reason}`,
              performedBy: senderName,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
      }
      return t;
    });

    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('طلب مساعدة ميدانية', 'update', 'task', taskId, message);
    this.notify();
  }

  // --- Task Approvals & Supervisions ---
  public approveTask(taskId: string, approvalNotes?: string): void {
    const currentUser = this.getCurrentUser();
    let targetTask: Task | undefined;

    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        const updated: Task = {
          ...t,
          status: 'completed',
          approvalNotes: approvalNotes || 'تم الاعتماد الإداري بنجاح',
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `اعتماد إنجاز المهمة بواسطة ${currentUser.name}${approvalNotes ? ` - ملاحظات: ${approvalNotes}` : ''}`,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
        targetTask = updated;
        return updated;
      }
      return t;
    });

    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('اعتماد إنجاز مهمة', 'approve', 'task', taskId, `تم الاعتماد بواسطة ${currentUser.name}`);

    if (targetTask) {
      this.addNotification({
        title: 'تم اعتماد مهمتك بنجاح ✓',
        message: `اعتمد المشرف ${currentUser.name} إنجاز مهمة "${(targetTask as Task).title}".`,
        type: 'success',
        targetView: 'daily',
      });
    }

    this.notify();
  }

  public rejectTask(taskId: string, rejectionReason: string): void {
    const currentUser = this.getCurrentUser();
    let targetTask: Task | undefined;

    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        const updated: Task = {
          ...t,
          status: 'rejected',
          rejectionReason,
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `رفض نتيجة الإنجاز بواسطة ${currentUser.name}: ${rejectionReason}`,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
        targetTask = updated;
        return updated;
      }
      return t;
    });

    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('رفض إنجاز مهمة', 'reject', 'task', taskId, `السبب: ${rejectionReason}`);

    if (targetTask) {
      this.addNotification({
        title: 'رفض إنجاز المهمة ⚠️',
        message: `تم رفض نتيجة إنجاز "${(targetTask as Task).title}". السبب: ${rejectionReason}`,
        type: 'alert',
        targetView: 'daily',
      });
    }

    this.notify();
  }

  public sendTaskForRework(taskId: string, reworkInstructions: string): void {
    const currentUser = this.getCurrentUser();
    let targetTask: Task | undefined;

    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        const updated: Task = {
          ...t,
          status: 'in_progress',
          notes: `${t.notes || ''}\n[توجيه استكمال ${new Date().toLocaleDateString('ar-AE')}]: ${reworkInstructions}`,
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `إعادة للتعديل واستكمال النواقص: ${reworkInstructions}`,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
        targetTask = updated;
        return updated;
      }
      return t;
    });

    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('إعادة مهمة للتعديل والمراجعة', 'update', 'task', taskId, reworkInstructions);

    if (targetTask) {
      this.addNotification({
        title: 'إعادة مهمة لاستكمال النواقص ↺',
        message: `أعاد المشرف ${currentUser.name} مهمة "${(targetTask as Task).title}" لمواصلة العمل. التوجيه: ${reworkInstructions}`,
        type: 'warning',
        targetView: 'daily',
      });
    }

    this.notify();
  }

  public bulkApproveTasks(taskIds: string[], notes?: string): void {
    taskIds.forEach((id) => this.approveTask(id, notes || 'اعتماد جماعي'));
  }

  public bulkApproveExpenses(expenseIds: string[]): void {
    expenseIds.forEach((id) => this.updateExpenseStatus(id, 'approved'));
  }

  // --- Task Comments & Discussions ---
  public addTaskComment(taskId: string, text: string, isInternal: boolean = false, mentions: string[] = []): void {
    const currentUser = this.getCurrentUser();
    const comment: TaskComment = {
      id: `cmt-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      text,
      createdAt: new Date().toLocaleString('ar-AE'),
      mentions,
      isInternal,
    };

    let targetTask: Task | undefined;

    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        const existingComments = t.comments || [];
        const updated: Task = {
          ...t,
          comments: [...existingComments, comment],
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `إضافة تعليق جديد ${isInternal ? '(داخلي للإدارة)' : ''}`,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
        targetTask = updated;
        return updated;
      }
      return t;
    });

    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('إضافة تعليق على مهمة', 'update', 'task', taskId, `${currentUser.name}: ${text.slice(0, 40)}...`);

    if (targetTask && (targetTask as Task).assigneeId !== currentUser.id) {
      this.addNotification({
        title: `تعليق جديد على "${(targetTask as Task).title}"`,
        message: `${currentUser.name}: ${text.slice(0, 60)}...`,
        type: 'info',
        targetView: 'daily',
      });
    }

    this.notify();
  }

  // --- Task Attachments Hub ---
  public addTaskAttachment(taskId: string, attachment: { name: string; url: string; size: string; type: string }): void {
    const currentUser = this.getCurrentUser();
    const newAttachment: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: attachment.name,
      url: attachment.url,
      size: attachment.size,
      type: attachment.type,
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toLocaleString('ar-AE'),
    };

    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId) {
        const existingAtt = t.attachments || [];
        return {
          ...t,
          attachments: [...existingAtt, newAttachment],
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `رفع مستند/مرفق: ${attachment.name}`,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
      }
      return t;
    });

    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.logAudit('إرفاق مستند بمهمة', 'update', 'task', taskId, `المستند: ${attachment.name}`);
    this.notify();
  }

  public deleteTaskAttachment(taskId: string, attachmentId: string): void {
    const currentUser = this.getCurrentUser();
    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId && t.attachments) {
        return {
          ...t,
          attachments: t.attachments.filter((a) => a.id !== attachmentId),
          history: [
            ...t.history,
            {
              id: `h-${Date.now()}`,
              action: `حذف مستند/مرفق بواسطة ${currentUser.name}`,
              performedBy: currentUser.name,
              timestamp: new Date().toLocaleString('ar-AE'),
            }
          ]
        };
      }
      return t;
    });

    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    this.notify();
  }

  // --- Settlements ---
  public getSettlements(): Settlement[] {
    return [...this.settlements];
  }

  public addSettlement(settlementData: Omit<Settlement, 'id' | 'code' | 'status' | 'submittedAt' | 'settledBy'>): Settlement {
    const currentUser = this.getCurrentUser();
    const newSettlement: Settlement = {
      ...settlementData,
      id: `stl-${Date.now()}`,
      code: `STL-2026-0${this.settlements.length + 1}`,
      status: 'under_review',
      submittedAt: new Date().toLocaleString('ar-AE'),
      settledBy: currentUser.name,
      settlementVoucherNumber: `VCH-STL-${Date.now().toString().slice(-4)}`,
    };

    this.settlements = [newSettlement, ...this.settlements];
    safeSet(STORAGE_KEYS.SETTLEMENTS, this.settlements);

    // Mark matched expenses as settled
    this.expenses = this.expenses.map((e) => {
      if (settlementData.expenseIds.includes(e.id)) {
        return { ...e, status: 'settled' };
      }
      return e;
    });
    safeSet(STORAGE_KEYS.EXPENSES, this.expenses);

    this.logAudit('رفع طلب تسوية عهدة', 'settle', 'settlement', newSettlement.id, `تسوية ${newSettlement.fundName} بإجمالي مصروفات ${newSettlement.totalExpenses} ${this.settings.currency}`);
    this.addNotification({
      title: 'طلب تسوية عهدة جديد',
      message: `قدم ${newSettlement.holderName} تسوية لعهدة ${newSettlement.fundName}.`,
      type: 'info',
      targetView: 'settlements',
    });
    this.notify();
    return newSettlement;
  }

  public approveSettlement(settlementId: string, auditNotes?: string): void {
    const currentUser = this.getCurrentUser();
    this.settlements = this.settlements.map((s) => {
      if (s.id === settlementId) {
        return {
          ...s,
          status: 'approved',
          approvedBy: currentUser.name,
          approvedAt: new Date().toLocaleString('ar-AE'),
          auditNotes: auditNotes || s.auditNotes,
        };
      }
      return s;
    });
    safeSet(STORAGE_KEYS.SETTLEMENTS, this.settlements);
    this.logAudit('اعتماد تسوية مالية', 'approve', 'settlement', settlementId, `تم اعتماد وإقفال التسوية بنجاح`);
    this.notify();
  }

  // --- Follow Ups ---
  public getFollowUps(): FollowUp[] {
    return [...this.followUps];
  }

  public addFollowUp(item: Omit<FollowUp, 'id' | 'status'>): FollowUp {
    const newFollowUp: FollowUp = {
      ...item,
      id: `flw-${Date.now()}`,
      status: 'pending',
    };
    this.followUps = [newFollowUp, ...this.followUps];
    safeSet(STORAGE_KEYS.FOLLOW_UPS, this.followUps);
    this.notify();
    return newFollowUp;
  }

  public updateFollowUpStatus(id: string, status: 'pending' | 'resolved' | 'escalated'): void {
    this.followUps = this.followUps.map((f) => (f.id === id ? { ...f, status } : f));
    safeSet(STORAGE_KEYS.FOLLOW_UPS, this.followUps);
    this.notify();
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public logAudit(
    action: string,
    actionType: AuditLog['actionType'],
    entity: AuditLog['entity'],
    entityId: string,
    details: string
  ): void {
    const currentUser = this.getCurrentUser();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      actionType,
      entity,
      entityId,
      details,
      timestamp: new Date().toLocaleString('ar-AE'),
      ipAddress: '192.168.1.' + Math.floor(10 + Math.random() * 200),
    };

    this.auditLogs = [newLog, ...this.auditLogs.slice(0, 150)];
    safeSet(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // --- Notifications ---
  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): void {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      createdAt: 'الآن',
      isRead: false,
    };
    this.notifications = [newNotif, ...this.notifications];
    safeSet(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  public markAllNotificationsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
    safeSet(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  public markNotificationRead(id: string): void {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    safeSet(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<SystemSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    safeSet(STORAGE_KEYS.SETTINGS, this.settings);
    this.logAudit('تحديث إعدادات النظام', 'update', 'system', 'sys-cfg', 'تم تعديل السياسات العامة والإعدادات التشغيلية.');
    this.notify();
  }

  // --- Database Stats & Backup Operations ---
  public getDatabaseStats() {
    const totalExpensesAmount = this.expenses.reduce((s, e) => s + e.totalWithTax, 0);
    const totalAllocation = this.funds.reduce((s, f) => s + f.totalAllocation, 0);
    const totalCurrentBalance = this.funds.reduce((s, f) => s + f.currentBalance, 0);

    const jsonStr = JSON.stringify({
      users: this.users,
      funds: this.funds,
      expenses: this.expenses,
      tasks: this.tasks,
      settlements: this.settlements,
      followUps: this.followUps,
      auditLogs: this.auditLogs,
      notifications: this.notifications,
      settings: this.settings,
    });

    const approximateSizeKb = Math.round((new Blob([jsonStr]).size / 1024) * 10) / 10;

    return {
      usersCount: this.users.length,
      fundsCount: this.funds.length,
      expensesCount: this.expenses.length,
      tasksCount: this.tasks.length,
      settlementsCount: this.settlements.length,
      followUpsCount: this.followUps.length,
      auditLogsCount: this.auditLogs.length,
      notificationsCount: this.notifications.length,
      totalExpensesAmount,
      totalAllocation,
      totalCurrentBalance,
      approximateSizeKb,
      lastUpdated: new Date().toLocaleString('ar-AE'),
    };
  }

  public exportDatabase(): string {
    const backupData = {
      exportVersion: '3.0',
      exportedAt: new Date().toISOString(),
      appName: this.settings.appName,
      data: {
        users: this.users,
        currentUserId: this.currentUserId,
        funds: this.funds,
        expenses: this.expenses,
        tasks: this.tasks,
        settlements: this.settlements,
        followUps: this.followUps,
        auditLogs: this.auditLogs,
        notifications: this.notifications,
        settings: this.settings,
      },
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importDatabase(jsonStr: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      const data = parsed.data || parsed;
      if (!data.funds && !data.expenses && !data.tasks) {
        return { success: false, error: 'الملف لا يحتوي على هيكل بيانات صالح للمنظومة.' };
      }

      if (Array.isArray(data.users)) this.users = data.users;
      if (typeof data.currentUserId === 'string') this.currentUserId = data.currentUserId;
      if (Array.isArray(data.funds)) this.funds = data.funds;
      if (Array.isArray(data.expenses)) this.expenses = data.expenses;
      if (Array.isArray(data.tasks)) this.tasks = data.tasks;
      if (Array.isArray(data.settlements)) this.settlements = data.settlements;
      if (Array.isArray(data.followUps)) this.followUps = data.followUps;
      if (Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
      if (Array.isArray(data.notifications)) this.notifications = data.notifications;
      if (data.settings) this.settings = { ...DEFAULT_SETTINGS, ...data.settings };

      safeSet(STORAGE_KEYS.USERS, this.users);
      safeSet(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);
      safeSet(STORAGE_KEYS.FUNDS, this.funds);
      safeSet(STORAGE_KEYS.EXPENSES, this.expenses);
      safeSet(STORAGE_KEYS.TASKS, this.tasks);
      safeSet(STORAGE_KEYS.SETTLEMENTS, this.settlements);
      safeSet(STORAGE_KEYS.FOLLOW_UPS, this.followUps);
      safeSet(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
      safeSet(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
      safeSet(STORAGE_KEYS.SETTINGS, this.settings);

      this.logAudit('استيراد قاعدة بيانات كاملة', 'create', 'system', 'sys-import', 'تمت استعادة نسخة احتياطية من ملف خارجي بنجاح.');
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'تعذر قراءة ملف JSON' };
    }
  }

  // --- Reset All Data ---
  public resetToDefault(): void {
    localStorage.clear();
    this.users = INITIAL_USERS;
    this.currentUserId = 'usr-1';
    this.funds = INITIAL_FUNDS;
    this.expenses = INITIAL_EXPENSES;
    this.tasks = INITIAL_TASKS;
    this.settlements = INITIAL_SETTLEMENTS;
    this.followUps = INITIAL_FOLLOW_UPS;
    this.auditLogs = INITIAL_AUDIT_LOGS;
    this.notifications = INITIAL_NOTIFICATIONS;
    this.settings = DEFAULT_SETTINGS;

    safeSet(STORAGE_KEYS.USERS, this.users);
    safeSet(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);
    safeSet(STORAGE_KEYS.FUNDS, this.funds);
    safeSet(STORAGE_KEYS.EXPENSES, this.expenses);
    safeSet(STORAGE_KEYS.TASKS, this.tasks);
    safeSet(STORAGE_KEYS.SETTLEMENTS, this.settlements);
    safeSet(STORAGE_KEYS.FOLLOW_UPS, this.followUps);
    safeSet(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    safeSet(STORAGE_KEYS.SETTINGS, this.settings);

    this.notify();
  }
}

export const dataStore = OpsDataStore.getInstance();
