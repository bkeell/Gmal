import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { formatCurrency } from '../../lib/utils/format';

interface CashFlowItem {
  week: string;
  allocation: number;
  spent: number;
  balance: number;
}

interface CashFlowChartProps {
  data?: CashFlowItem[];
}

const DEFAULT_DATA: CashFlowItem[] = [
  { week: 'الأسبوع 1', allocation: 50000, spent: 7800, balance: 42200 },
  { week: 'الأسبوع 2', allocation: 50000, spent: 14200, balance: 35800 },
  { week: 'الأسبوع 3', allocation: 50000, spent: 21900, balance: 28100 },
  { week: 'الأسبوع 4', allocation: 50000, spent: 28050, balance: 21950 },
];

export const OperationsCashFlowChart: React.FC<CashFlowChartProps> = ({ data = DEFAULT_DATA }) => {
  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="week"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
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
                  <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 min-w-[170px]" dir="rtl">
                    <span className="font-extrabold text-slate-800 block border-b border-slate-100 pb-1">{label}</span>
                    <div className="flex justify-between items-center text-emerald-700">
                      <span>الرصيد المتاح:</span>
                      <strong className="font-mono">{formatCurrency(payload[0]?.value as number)}</strong>
                    </div>
                    <div className="flex justify-between items-center text-indigo-700">
                      <span>المصروف التراكمي:</span>
                      <strong className="font-mono">{formatCurrency(payload[1]?.value as number)}</strong>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            name="الرصيد المتاح"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#balanceGrad)"
          />
          <Area
            type="monotone"
            dataKey="spent"
            name="المصروف التراكمي"
            stroke="#6366f1"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#spentGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface CategoryPieProps {
  data: {
    category: string;
    label: string;
    amount: number;
    count: number;
  }[];
}

const CATEGORY_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export const ExpenseDonutChart: React.FC<CategoryPieProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    name: d.label,
    value: d.amount,
  }));

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="w-full h-64 sm:h-72 flex flex-col items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                const pct = total ? Math.round(((item.value as number) / total) * 100) : 0;
                return (
                  <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 shadow-md text-xs min-w-[150px]" dir="rtl">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload?.fill }} />
                      <strong className="text-slate-800">{item.name}</strong>
                    </div>
                    <div className="mt-1 text-slate-600 font-mono font-bold">
                      {formatCurrency(item.value as number)} ({pct}%)
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Inner Label for Donut Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[11px] font-bold text-slate-400">إجمالي الصرف</span>
        <span className="text-sm font-black text-slate-800 mt-0.5">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};
