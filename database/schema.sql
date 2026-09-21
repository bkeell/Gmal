-- ============================================================
-- OpsPlatform Database Schema (PostgreSQL / Supabase)
-- نظام إدارة العمليات الميدانية والعهد النقدية والمطابقة المالية
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enum Types
DO $$ BEGIN
    CREATE TYPE role_type AS ENUM ('admin', 'ops_manager', 'finance_officer', 'field_officer', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fund_status AS ENUM ('active', 'warning', 'depleted', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'settled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE settlement_status AS ENUM ('draft', 'under_review', 'audited', 'approved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table (المستخدمون ومسؤولو النظام)
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS petty_cash_funds (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Operational Tasks (المهام الميدانية والتشغيلية)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
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
  spent_amount DECIMAL(12, 2) DEFAULT 0.00,
  checklist JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Expenses & Invoices (المصروفات وفواتير المشتريات الميدانية)
CREATE TABLE IF NOT EXISTS expenses (
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

-- 5. Financial Settlements (التسويات وإقفال العهد النقدية)
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  fund_id UUID REFERENCES petty_cash_funds(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  advance_amount DECIMAL(12, 2) NOT NULL,
  total_expenses DECIMAL(12, 2) NOT NULL,
  remaining_amount DECIMAL(12, 2) NOT NULL,
  status settlement_status DEFAULT 'under_review',
  expense_ids UUID[] NOT NULL DEFAULT '{}',
  settled_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  audit_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 6. Audit Logs (سجل التدقيق الأمني والرقابة المالية والتشغيلية)
CREATE TABLE IF NOT EXISTS audit_logs (
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
);

-- ============================================================
-- Indexes for High Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_fund ON tasks(fund_id);
CREATE INDEX IF NOT EXISTS idx_funds_holder ON petty_cash_funds(holder_id);
CREATE INDEX IF NOT EXISTS idx_funds_status ON petty_cash_funds(status);
CREATE INDEX IF NOT EXISTS idx_expenses_fund ON expenses(fund_id);
CREATE INDEX IF NOT EXISTS idx_expenses_task ON expenses(task_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_settlements_fund ON settlements(fund_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- Row-Level Security (RLS) & Policies for Supabase / PostgreSQL
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE petty_cash_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view active data
CREATE POLICY "Authenticated users can view users" ON users FOR SELECT USING (true);
CREATE POLICY "Authenticated users can view funds" ON petty_cash_funds FOR SELECT USING (true);
CREATE POLICY "Authenticated users can view tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can view expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can view settlements" ON settlements FOR SELECT USING (true);
CREATE POLICY "Authenticated users can view audit logs" ON audit_logs FOR SELECT USING (true);
