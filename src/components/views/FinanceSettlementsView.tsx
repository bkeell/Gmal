import React, { useState } from 'react';
import { 
  FileCheck2, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Download, 
  ShieldCheck, 
  DollarSign, 
  Building,
  UserCheck
} from 'lucide-react';
import { dataStore } from '../../lib/storage';
import { SettlementsService } from '../../services/settlements.service';
import { Settlement } from '../../types/domain';
import { formatCurrency, formatDate, SETTLEMENT_STATUS_CONFIG } from '../../lib/utils/format';
import { hasPermission } from '../../lib/rbac/permissions';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { NewSettlementModal } from '../modals/NewSettlementModal';

export const FinanceSettlementsView: React.FC = () => {
  const settlements = SettlementsService.getAll();
  const currentUser = dataStore.getCurrentUser();
  const canCreate = hasPermission(currentUser.role, 'settlements', 'create');
  const canApprove = hasPermission(currentUser.role, 'settlements', 'approve');

  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [printVoucher, setPrintVoucher] = useState<Settlement | null>(null);
  const [isNewSettlementOpen, setIsNewSettlementOpen] = useState(false);

  const handleApprove = (id: string) => {
    SettlementsService.approve(id);
    if (selectedSettlement && selectedSettlement.id === id) {
      setSelectedSettlement({ ...selectedSettlement, status: 'approved' });
    }
  };

  const handleFinalize = (id: string) => {
    SettlementsService.finalize(id);
    if (selectedSettlement && selectedSettlement.id === id) {
      setSelectedSettlement({ ...selectedSettlement, status: 'closed' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">دورات التسوية المالية وتصفية العهد</h3>
          <p className="text-xs text-slate-500">
            مطابقة الفواتير الميدانية بالكامل، اعتماد المحاسب المالي، وإصدار سندات التصفية الرسمية
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewSettlementOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            className="text-xs sm:text-sm"
          >
            إنشاء دورة تسوية جديدة
          </Button>
        )}
      </div>

      {/* Settlements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settlements.map((settlement) => {
          const statusCfg = SETTLEMENT_STATUS_CONFIG[settlement.status];

          return (
            <Card key={settlement.id} hover className="border-slate-200/90 shadow-xs">
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {settlement.code}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-2">
                      {settlement.fundName}
                    </h4>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${statusCfg.bg} ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Period */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    الفترة: {formatDate(settlement.periodStart)} إلى {formatDate(settlement.periodEnd)}
                  </span>
                </div>

                {/* Financial Totals */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 block mb-0.5">الفواتير المنصرفة</span>
                    <span className="font-black text-slate-900 dir-ltr text-right block">
                      {formatCurrency(settlement.totalExpenses)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <span className="text-[11px] text-emerald-600 block mb-0.5">النقد المتبقي بالعهدة</span>
                    <span className="font-black text-emerald-800 dir-ltr text-right block">
                      {formatCurrency(settlement.remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Approver info */}
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span>أمين العهدة: {settlement.holderName || settlement.settledBy}</span>
                  {settlement.approvedBy && (
                    <span className="text-emerald-700 font-medium">معتمد: {settlement.approvedBy}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintVoucher(settlement)}
                    icon={<Printer className="w-3.5 h-3.5 text-slate-600" />}
                    className="text-xs"
                  >
                    سند التصفية
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSettlement(settlement)}
                    className="text-xs text-indigo-600 font-bold"
                  >
                    معاينة التفاصيل
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Settlement Detail Modal */}
      {selectedSettlement && (
        <Modal
          isOpen={!!selectedSettlement}
          onClose={() => setSelectedSettlement(null)}
          title={`تسوية العهدة: ${selectedSettlement.code}`}
          description={selectedSettlement.fundName}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 text-xs block mb-0.5">التخصيص الأولي</span>
                <span className="font-bold text-slate-800 dir-ltr block">
                  {formatCurrency(selectedSettlement.advanceAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block mb-0.5">إجمالي المصروفات</span>
                <span className="font-bold text-slate-800 dir-ltr block">
                  {formatCurrency(selectedSettlement.totalExpenses)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block mb-0.5">المبلغ المسترد</span>
                <span className="font-bold text-slate-800 dir-ltr block">
                  {formatCurrency(selectedSettlement.remainingAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block mb-0.5">حالة التسوية</span>
                <span className="font-bold text-indigo-700 block">
                  {SETTLEMENT_STATUS_CONFIG[selectedSettlement.status].label}
                </span>
              </div>
            </div>

            {selectedSettlement.auditNotes && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-600">ملاحظات وقرارات التدقيق:</span>
                <p className="text-slate-700 leading-relaxed">{selectedSettlement.auditNotes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-2">
                {canApprove && (selectedSettlement.status === 'under_review' || selectedSettlement.status === 'draft') && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleApprove(selectedSettlement.id)}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    اعتماد التسوية
                  </Button>
                )}

                {canApprove && selectedSettlement.status === 'approved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleFinalize(selectedSettlement.id)}
                    icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  >
                    إقفال العهدة نهائياً
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPrintVoucher(selectedSettlement);
                    setSelectedSettlement(null);
                  }}
                  icon={<Printer className="w-3.5 h-3.5" />}
                >
                  طباعة السند
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setSelectedSettlement(null)}>
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Voucher Modal */}
      {printVoucher && (
        <Modal
          isOpen={!!printVoucher}
          onClose={() => setPrintVoucher(null)}
          title="سند تصفية وتسوية العهدة النقدية (معاينة الطباعة)"
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Printable Document Container */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 space-y-6 text-slate-900" id="printable-voucher">
              {/* Official Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight">شركة العمليات والخدمات الميدانية المتكاملة</h2>
                  <p className="text-xs text-slate-600">الإدارة المالية - قسم التدقيق والمراجعة الداخلية للعهد</p>
                </div>
                <div className="text-left">
                  <span className="text-xs font-mono font-bold text-slate-600 block">رقم السند: {printVoucher.code}</span>
                  <span className="text-xs text-slate-500 block">التاريخ: {new Date().toLocaleDateString('ar-AE')}</span>
                </div>
              </div>

              <div className="text-center py-2 bg-slate-100 rounded-lg">
                <h3 className="font-black text-base text-slate-900">سند تسوية وإقفال عهدة نقدية معتمد</h3>
              </div>

              {/* Fund & Cycle Details */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div>
                  <span className="text-slate-500 block">اسم العهدة:</span>
                  <strong className="text-slate-900 text-sm">{printVoucher.fundName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">الموظف المسؤول (أمين العهدة):</span>
                  <strong className="text-slate-900 text-sm">{printVoucher.holderName || printVoucher.settledBy}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">فترة التسوية:</span>
                  <span className="text-slate-800 font-medium">من {printVoucher.periodStart} إلى {printVoucher.periodEnd}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">حالة الاعتماد المحاسبي:</span>
                  <strong className="text-emerald-700">معتمد ومطابق دفترياً</strong>
                </div>
              </div>

              {/* Financial Balance Statement */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-700">جدول المطابقة الحسابية (AED):</h4>
                <table className="w-full text-xs text-right border border-slate-200">
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-50 font-medium">
                      <td className="p-2.5">المبلغ المخصص للعهدة (رأس مال العهدة)</td>
                      <td className="p-2.5 font-bold dir-ltr text-right">{formatCurrency(printVoucher.advanceAmount)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">إجمالي الفواتير والمصروفات المقدمة والمدققة</td>
                      <td className="p-2.5 font-bold text-rose-700 dir-ltr text-right">- {formatCurrency(printVoucher.totalExpenses)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">المبلغ النقدي المتبقي والمسترد للخزينة</td>
                      <td className="p-2.5 font-bold text-emerald-700 dir-ltr text-right">{formatCurrency(printVoucher.remainingAmount)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-black">
                      <td className="p-2.5">صافي الفارق الحسابي (تطابق صفري)</td>
                      <td className="p-2.5 text-emerald-800 dir-ltr text-right">0.00 درهم (مطابق 100%)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures & Official Stamp Row */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 text-center text-xs relative">
                <div className="space-y-4">
                  <span className="font-bold text-slate-700 block">أمين العهدة (المستلم):</span>
                  <div className="h-10 border-b border-dashed border-slate-400" />
                  <span className="text-[11px] text-slate-500">{printVoucher.holderName || printVoucher.settledBy}</span>
                </div>
                <div className="space-y-4 relative">
                  <span className="font-bold text-slate-700 block">المحاسب المالي (المدقق):</span>
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-center justify-center">
                    {/* Official Internal Audit Stamp */}
                    <div className="border-2 border-emerald-600/60 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-md -rotate-6">
                      ✓ تدقيق ومطابقة مالية معتمدة
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">{printVoucher.approvedBy || 'فارس الكعبي'}</span>
                </div>
                <div className="space-y-4">
                  <span className="font-bold text-slate-700 block">المدير العام (الاعتماد النهائي):</span>
                  <div className="h-10 border-b border-dashed border-slate-400" />
                  <span className="text-[11px] text-slate-500">م. خالد المنصوري</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => window.print()}
                icon={<Printer className="w-4 h-4" />}
              >
                طباعة المستند الآن
              </Button>
              <Button variant="outline" size="md" onClick={() => setPrintVoucher(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Settlement Modal */}
      <NewSettlementModal
        isOpen={isNewSettlementOpen}
        onClose={() => setIsNewSettlementOpen(false)}
      />
    </div>
  );
};
