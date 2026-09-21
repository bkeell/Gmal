export type Role = 'admin' | 'ops_manager' | 'finance_officer' | 'field_officer' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleTitleAr: string;
  phone: string;
  department: string;
  avatar: string;
  active: boolean;
  assignedFundsCount?: number;
  activeTasksCount?: number;
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 
  | 'new'
  | 'scheduled'
  | 'started'
  | 'in_progress'
  | 'paused'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'deferred'
  | 'cancelled'
  | 'todo'       // backward compatibility
  | 'review'     // backward compatibility
  | 'completed'; // backward compatibility

export type TaskOutcome = 
  | 'completed'
  | 'partially_completed'
  | 'not_completed'
  | 'unable_to_execute'
  | 'needs_followup';

export type TaskOutcomeReason =
  | 'client_unavailable'
  | 'document_missing'
  | 'payment_pending'
  | 'needs_approval'
  | 'client_postponed'
  | 'weather_conditions'
  | 'technical_blocker'
  | 'other';

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskHistoryItem {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
}

export interface TaskChainNode {
  id: string;
  title: string;
  status: TaskStatus;
  outcome?: TaskOutcome;
  outcomeReason?: string;
  date: string;
  assigneeName: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar?: string;
  supervisorId?: string;
  supervisorName?: string;
  dueDate: string;
  startDate: string;
  dueTime?: string; // e.g. "14:30"
  location: string;
  mapsUrl?: string;
  geoCoordinates?: { lat: number; lng: number };
  category: string;
  taskType?: string; // e.g. "زيارة ميدانية", "تحصيل مالي", "صيانة", "تسليم"
  clientName?: string;
  clientContact?: string;
  clientPhone?: string;
  proofRequired?: string; // e.g. "صورة المستند المختوم", "توقيع العميل", "إيصال استلام"
  proofAttachmentUrl?: string;
  budget: number;
  spentAmount: number;
  tags: string[];
  checklist: TaskChecklistItem[];
  history: TaskHistoryItem[];
  fundId?: string;
  taskFundAmount?: number;
  taskFundSpent?: number;
  taskFundRemaining?: number;
  notes?: string;
  createdAt: string;

  // Execution Time Tracking
  timeSpentMinutes?: number;
  isTimerRunning?: boolean;
  timerStartedAt?: string;

  // Lifecycle Outcome
  outcome?: TaskOutcome;
  outcomeReason?: TaskOutcomeReason | string;
  outcomeNotes?: string;
  outcomeSubmittedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;

  // Task Chain & Linked Follow-ups
  parentTaskId?: string;
  chainFollowUpTaskId?: string;
  taskChain?: TaskChainNode[];

  // Attachments & Discussion
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string; // 'image' | 'pdf' | 'doc' | 'receipt' | 'other'
  uploadedBy: string;
  uploadedAt: string;
}

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  text: string;
  createdAt: string;
  mentions?: string[];
  isInternal?: boolean;
}

export type FundStatus = 'active' | 'warning' | 'depleted' | 'closed';

export interface PettyCashFund {
  id: string;
  name: string;
  code: string;
  holderId: string;
  holderName: string;
  holderDepartment: string;
  totalAllocation: number;
  currentBalance: number;
  spentBalance: number;
  currency: string;
  status: FundStatus;
  warningThreshold: number; // e.g. 20%
  lastReplenishedDate: string;
  purpose: string;
  notes?: string;
}

export type ExpenseCategory = 
  | 'transport'
  | 'materials'
  | 'hospitality'
  | 'maintenance'
  | 'government'
  | 'fuel'
  | 'tools'
  | 'other';

export type ExpenseStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'settled';

export interface Expense {
  id: string;
  code: string;
  fundId: string;
  fundName: string;
  amount: number;
  taxAmount: number;
  totalWithTax: number;
  category: ExpenseCategory;
  description: string;
  invoiceNumber: string;
  vendorName: string;
  receiptUrl?: string;
  hasReceipt: boolean;
  status: ExpenseStatus;
  submittedBy: string;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  taskId?: string;
  taskTitle?: string;
  notes?: string;
}

export type SettlementStatus = 'draft' | 'under_review' | 'audited' | 'approved' | 'closed';

export interface Settlement {
  id: string;
  code: string;
  fundId: string;
  fundName: string;
  holderName: string;
  periodStart: string;
  periodEnd: string;
  advanceAmount: number;
  totalExpenses: number;
  remainingAmount: number;
  status: SettlementStatus;
  expenseIds: string[];
  expensesCount: number;
  submittedAt: string;
  settledBy: string;
  approvedBy?: string;
  approvedAt?: string;
  auditNotes?: string;
  settlementVoucherNumber?: string;
}

export interface FollowUp {
  id: string;
  taskId?: string;
  taskTitle?: string;
  title: string;
  urgency: 'critical' | 'high' | 'normal';
  assignedTo: string;
  scheduledDate: string;
  status: 'pending' | 'resolved' | 'escalated';
  notes: string;
  lastContactDate?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'settle' | 'auth';
  entity: 'task' | 'expense' | 'fund' | 'settlement' | 'user' | 'system';
  entityId: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  isRead: boolean;
  createdAt: string;
  targetView?: string;
}

export interface PermissionRule {
  module: string;
  moduleAr: string;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
  };
}
