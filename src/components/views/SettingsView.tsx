import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  CheckCircle2,
  Building2,
  Wallet,
  Sliders,
  Bell,
  ShieldCheck,
  Database,
  Download,
  Upload,
  AlertTriangle,
  FileText,
  Check,
  X,
  Lock,
  Activity,
  HardDrive,
  Info,
  Phone,
  Mail,
  MapPin,
  Layers,
  Clock,
  ExternalLink,
  Shield,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { dataStore, SystemSettings } from '../../lib/storage';
import { ROLE_PERMISSIONS, ROLE_LABELS } from '../../lib/rbac/permissions';
import { Role } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface SettingsViewProps {
  onSelectView?: (view: string) => void;
}

type TabType = 'general' | 'finance' | 'operations' | 'notifications' | 'rbac' | 'database';

export const SettingsView: React.FC<SettingsViewProps> = ({ onSelectView }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [settings, setSettings] = useState<SystemSettings>(dataStore.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Backup & Restore states
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [dbStats, setDbStats] = useState(dataStore.getDatabaseStats());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = dataStore.getCurrentUser();

  // Reload settings on external changes
  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setSettings(dataStore.getSettings());
      setDbStats(dataStore.getDatabaseStats());
    });
    return unsub;
  }, []);

  const handleChange = <K extends keyof SystemSettings>(field: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    dataStore.updateSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleResetData = () => {
    dataStore.resetToDefault();
    setSettings(dataStore.getSettings());
    setShowResetConfirm(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3500);
  };

  const handleExportBackup = () => {
    try {
      const jsonStr = dataStore.exportDatabase();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `ops-platform-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Backup export failed:', err);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = dataStore.importDatabase(content);
        if (result.success) {
          setImportStatus({ success: true, message: 'تمت استعادة كافة السجلات والإعدادات بنجاح!' });
          setSettings(dataStore.getSettings());
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus({ success: false, message: result.error || 'فشل في استيراد الملف' });
        }
      } catch (err: any) {
        setImportStatus({ success: false, message: 'تعذر قراءة محتوى الملف بصيغة JSON صالحة' });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const modulesList = [
    { key: 'dashboard', label: 'لوحة المؤشرات والقيادة' },
    { key: 'tasks', label: 'إدارة المهام والعمليات' },
    { key: 'followUps', label: 'سجل المتابعات الدورية' },
    { key: 'funds', label: 'صناديق العهد النقدية' },
    { key: 'expenses', label: 'فواتير ومصروفات العهد' },
    { key: 'settlements', label: 'التسويات وسندات الصرف' },
    { key: 'calendar', label: 'التقويم والجدول الزمني' },
    { key: 'reports', label: 'التقارير والتحليلات المالية' },
    { key: 'team', label: 'فريق العمل والكوادر' },
    { key: 'audit', label: 'سجلات التدقيق الأمني' },
    { key: 'settings', label: 'إعدادات المنظومة والسياسات' },
  ];

  const expenseCategoriesInfo = [
    { key: 'materials', label: 'مواد ومستلزمات تشغيلية', desc: 'شراء قطع غيار، مستلزمات مواقع، كابلات، لوازم فورية' },
    { key: 'fuel', label: 'محروقات ونقل مركبات', desc: 'بترول، ديزل لمركبات الشركة والمولدات الميدانية' },
    { key: 'maintenance', label: 'صيانة وإصلاحات طارئة', desc: 'إصلاح معدات، مكيفات، ورش فنية، سباكة وميكانيكا' },
    { key: 'hospitality', label: 'ضيافة ونثريات العمليات', desc: 'مياه ومشروبات للفرق الميدانية واجتماعات المواقع' },
    { key: 'tools', label: 'أدوات ومعدات صغيرة', desc: 'أدوات قياس، عدد يدوية، معدات حماية وسلامة مهنية' },
    { key: 'transport', label: 'نقل وشحن ومواصلات', desc: 'سالك، مواقف، شحن سريع للعينات والقطع' },
    { key: 'government', label: 'رسوم ومعاملات رسمية', desc: 'تصاريح دخول المواقع، رسوم بلدية وموافقات سريعة' },
    { key: 'other', label: 'مصروفات أخرى متنوعة', desc: 'أي نفقات طارئة أخرى مشمولة بسياسة الصرف' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner & Quick Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900">إعدادات المنظومة وتخصيص السياسات</h2>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                إصدار 3.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              التحكم الشامل بهوية المنشأة، المعايير المالية، قواعد التشغيل، مصفوفة الصلاحيات، والنسخ الاحتياطي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              تم حفظ كافة التغييرات!
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={() => handleSave()}
            icon={<Save className="w-4 h-4" />}
            className="text-xs font-bold px-4"
          >
            حفظ التغييرات
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 scrollbar-thin">
        {[
          { id: 'general', label: 'الهوية والمؤسسة', icon: <Building2 className="w-4 h-4" /> },
          { id: 'finance', label: 'السياسات المالية والرقابة', icon: <Wallet className="w-4 h-4" /> },
          { id: 'operations', label: 'إدارة المهام والعمليات', icon: <Sliders className="w-4 h-4" /> },
          { id: 'notifications', label: 'التنبيهات والإشعارات', icon: <Bell className="w-4 h-4" /> },
          { id: 'rbac', label: 'مصفوفة الصلاحيات والأمان', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'database', label: 'قاعدة البيانات والنسخ الاحتياطي', icon: <Database className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className={activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: General & Organization */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  بيانات المؤسسة والهوية الرسمية
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">تظهر هذه المعلومات في ترويسة التقارير وسندات الصرف والتسويات الرسمية</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">اسم المنظومة المعروض</label>
                  <Input
                    type="text"
                    value={settings.appName}
                    onChange={(e) => handleChange('appName', e.target.value)}
                    placeholder="اسم المنظومة"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">اسم الشركة / المؤسسة الرسمي</label>
                  <Input
                    type="text"
                    value={settings.organizationName}
                    onChange={(e) => handleChange('organizationName', e.target.value)}
                    placeholder="اسم الشركة"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    رقم التسجيل الضريبي المعتمد (TRN)
                  </label>
                  <Input
                    type="text"
                    value={settings.taxRegistrationNumber}
                    onChange={(e) => handleChange('taxRegistrationNumber', e.target.value)}
                    placeholder="مثال: 100234567800003"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    المقر الرئيسي والفرع الإداري
                  </label>
                  <Input
                    type="text"
                    value={settings.headquarters}
                    onChange={(e) => handleChange('headquarters', e.target.value)}
                    placeholder="المدينة والفرع"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    البريد الإلكتروني للإدارة والدعم المالي
                  </label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    placeholder="finance-support@company.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    هاتف خط العمليات والطوارئ
                  </label>
                  <Input
                    type="text"
                    value={settings.supportPhone}
                    onChange={(e) => handleChange('supportPhone', e.target.value)}
                    placeholder="+971 2 600 5000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                تنسيقات الوقت والتقويم والواجهة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">تنسيق عرض التاريخ</label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-20)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (20/09/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (09/20/2026)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">نظام التوقيت</label>
                  <select
                    value={settings.timeFormat}
                    onChange={(e) => handleChange('timeFormat', e.target.value as '12h' | '24h')}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="24h">نظام 24 ساعة (مثال: 16:30)</option>
                    <option value="12h">نظام 12 ساعة (مثال: 04:30 م)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">تنسيق المبالغ والأرقام</label>
                  <select
                    value={settings.numberFormatting}
                    onChange={(e) => handleChange('numberFormatting', e.target.value as 'standard' | 'compact')}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="standard">قياسي مع فواصل الآلاف (25,000.00)</option>
                    <option value="compact">مختصر في الجداول والمؤشرات (25K)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: Financial Policies & Controls */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                المعايير المحاسبية والحدود الرقابية للصرف
              </CardTitle>
              <p className="text-xs text-slate-500">
                تطبق هذه القواعد بصورة آلية عند تسجيل أي مصروف أو تقديم تسوية أو مراقبة أرصدة العهد
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">العملة الأساسية للنظام</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="QAR">ريال قطري (QAR)</option>
                    <option value="KWD">دينار كويتي (KWD)</option>
                    <option value="BHD">دينار بحريني (BHD)</option>
                    <option value="OMR">ريال عماني (OMR)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">نسبة ضريبة القيمة المضافة VAT (%)</label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={settings.taxRate.toString()}
                    onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-[11px] text-slate-400">تُحتسب تلقائياً في فواتير المصروفات الضريبية (الافتراضي 5%)</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">سقف المصروف الفردي بدون موافقة عليا ({settings.currency})</label>
                  <Input
                    type="number"
                    step="500"
                    min="500"
                    value={settings.singleExpenseLimit.toString()}
                    onChange={(e) => handleChange('singleExpenseLimit', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-[11px] text-slate-400">أي مصروف يتجاوز هذا الحد يتطلب موافقة المدير التنفيذي</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">نسبة تنبيه استنزاف رصيد العهدة (%)</label>
                  <Input
                    type="number"
                    min="5"
                    max="50"
                    value={settings.fundWarningThresholdPercent.toString()}
                    onChange={(e) => handleChange('fundWarningThresholdPercent', parseInt(e.target.value) || 20)}
                  />
                  <p className="text-[11px] text-slate-400">يتحول لون بطاقة الصندوق للأصفر ويُرسل تنبيه فوري</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">شهر بداية السنة المالية</label>
                  <select
                    value={settings.fiscalYearStartMonth}
                    onChange={(e) => handleChange('fiscalYearStartMonth', parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="1">يناير (بداية السنة الميلادية)</option>
                    <option value="4">إبريل (الربع الثاني)</option>
                    <option value="7">يوليو (منتصف السنة)</option>
                    <option value="10">أكتوبر (الربع الرابع)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">قواعد التحقق والتدقيق المالي الصارم</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleChange('requireReceiptForExpense', !settings.requireReceiptForExpense)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      settings.requireReceiptForExpense
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        settings.requireReceiptForExpense ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {settings.requireReceiptForExpense && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">إلزامية إرفاق صورة الفاتورة / الإيصال</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        يمنع اعتماد أي فاتورة مصروف لا تتضمن صورة ضوئية للفاتورة الأصلية.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => handleChange('requireInvoiceNumber', !settings.requireInvoiceNumber)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      settings.requireInvoiceNumber
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        settings.requireInvoiceNumber ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {settings.requireInvoiceNumber && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">إلزامية إدخال رقم الفاتورة الضريبية والمورد</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        اشتراط تسجيل رقم فاتورة المورد الرسمي لضمان الامتثال لضريبة القيمة المضافة.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      handleChange('requireDualApprovalForSettlements', !settings.requireDualApprovalForSettlements)
                    }
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      settings.requireDualApprovalForSettlements
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        settings.requireDualApprovalForSettlements
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {settings.requireDualApprovalForSettlements && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">التدقيق والاعتماد الثنائي لسندات التسوية</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        تتطلب التسوية مراجعة المحاسب ثم موافقة رئيس التدقيق المالي لإغلاقها نهائياً.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => handleChange('autoNotifyOnLowBalance', !settings.autoNotifyOnLowBalance)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      settings.autoNotifyOnLowBalance
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        settings.autoNotifyOnLowBalance ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {settings.autoNotifyOnLowBalance && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">تنبيهات استنزاف الرصيد التلقائية</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        إرسال إشعار فوري لمدير العهدة ومسؤول المالية بمجرد ملامسة النسبة الحرجة.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense Categories Reference */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                فئات وتصنيفات المصروفات المعتمدة في المنظومة
              </CardTitle>
              <p className="text-xs text-slate-500">التصنيفات القياسية المتاحة لفرق العمل والمشرفين الميدانيين</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {expenseCategoriesInfo.map((cat) => (
                  <div key={cat.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                      <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                        {cat.key}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{cat.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: Operations & Tasks */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                سياسات إدارة المهام والمتابعات الميدانية
              </CardTitle>
              <p className="text-xs text-slate-500">ضبط مسارات العمل، مدد الإنجاز، والتكامل المالي للمهام</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">المدة التلقائية لإنجاز المهمة (أيام)</label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.defaultTaskDurationDays.toString()}
                    onChange={(e) => handleChange('defaultTaskDurationDays', parseInt(e.target.value) || 7)}
                  />
                  <p className="text-[11px] text-slate-400">تحدد تاريخ الاستحقاق المقترح عند إنشاء مهمة جديدة</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">نسبة التسامح لتجاوز الميزانية (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.budgetOverrunTolerancePercent.toString()}
                    onChange={(e) => handleChange('budgetOverrunTolerancePercent', parseInt(e.target.value) || 10)}
                  />
                  <p className="text-[11px] text-slate-400">النسبة المسموح بها لتجاوز المصروف الفعلي لميزانية المهمة</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">تذكير المتابعات قبل الموعد (ساعات)</label>
                  <Input
                    type="number"
                    min="1"
                    max="72"
                    value={settings.autoFollowUpReminderHours.toString()}
                    onChange={(e) => handleChange('autoFollowUpReminderHours', parseInt(e.target.value) || 24)}
                  />
                  <p className="text-[11px] text-slate-400">إرسال إشعار للمشرف قبل حلول موعد المتابعة الميدانية</p>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">قواعد الربط المالي والميداني</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleChange('requireFundForTaskExpenses', !settings.requireFundForTaskExpenses)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      settings.requireFundForTaskExpenses
                        ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        settings.requireFundForTaskExpenses ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {settings.requireFundForTaskExpenses && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">إلزامية ربط مصاريف المهمة بعهدة نقدية نشطة</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        يمنع تسجيل أي مصروف على المهمة دون تخصيص صندوق العهدة الذي تم الصرف منه.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => handleChange('allowOfflineTaskSync', !settings.allowOfflineTaskSync)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      settings.allowOfflineTaskSync
                        ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        settings.allowOfflineTaskSync ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {settings.allowOfflineTaskSync && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">تمكين تحديث قوائم الفحص في المواقع النائية</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        حفظ حالة عناصر الفحص محلياً وتحديث المنظومة فور عودة الاتصال بشبكة الإنترنت.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: Notifications & Alerts */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                قنوات وقواعد التنبيهات والإشعارات الفورية
              </CardTitle>
              <p className="text-xs text-slate-500">تخصيص الأحداث التي تولد تنبيهات في شريط الإشعارات العلوي للمستخدمين</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  key: 'notifyOnUrgentTask',
                  title: 'تنبيه فوري للمهام العاجلة والحرجة (Urgent Priority)',
                  desc: 'إشعار فوري عند تكليف أي عضو بمهمة مصنفة كعاجلة أو طارئة بالموقع.',
                },
                {
                  key: 'notifyOnExpenseRejected',
                  title: 'إشعار رفض الفاتورة من التدقيق المالي',
                  desc: 'إخطار مقدم المصروف بأسباب الرفض المسجلة من قِبل المدقق لتصحيحها أو استبدالها.',
                },
                {
                  key: 'notifyOnFundReplenished',
                  title: 'إشعار إعادة تغذية رصيد العهدة النقدية',
                  desc: 'تنبيه مسؤول الصندوق عند إيداع مبالغ تعزيز الرصيد واعتماد سند الصرف.',
                },
                {
                  key: 'notifyOnSettlementDue',
                  title: 'تذكير باستحقاق دورة التسوية والمطابقة الشهرية',
                  desc: 'إشعار تلقائي قبل موعد إقفال العهدة الدوري لتسليم الفواتير المتبقية.',
                },
                {
                  key: 'enableSoundAlerts',
                  title: 'تفعيل المؤثرات الصوتية للتنبيهات الفورية',
                  desc: 'تشغيل نغمة تنبيه خفيفة عند وصول إشعار رقابي أو مالي جديد أثناء تصفح المنظومة.',
                },
              ].map((item) => {
                const isChecked = !!settings[item.key as keyof SystemSettings];
                return (
                  <div
                    key={item.key}
                    onClick={() => handleChange(item.key as any, !isChecked)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isChecked
                        ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{item.title}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>

                    <div
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${
                        isChecked ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          isChecked ? 'translate-x-[-18px]' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: RBAC & Security */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    مصفوفة صلاحيات الأدوار التشغيلية (RBAC Matrix)
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    الأذونات المحددة لكل دور وظيفي في المنظومة لضمان الفصل التام للمهام الرقابية
                  </p>
                </div>

                {onSelectView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectView('roles')}
                    className="text-xs"
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    إدارة شاشات الأدوار
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role definitions overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(['admin', 'ops_manager', 'finance_officer', 'field_officer', 'viewer'] as Role[]).map((r) => {
                  const roleMeta = ROLE_LABELS[r];
                  return (
                    <div key={r} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${roleMeta.badgeColor}`}>
                          {roleMeta.ar}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{r}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{roleMeta.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Matrix Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">الوحدة التشغيلية</th>
                        <th className="py-2.5 px-2 text-center">مدير النظام</th>
                        <th className="py-2.5 px-2 text-center">مدير العمليات</th>
                        <th className="py-2.5 px-2 text-center">المسؤول المالي</th>
                        <th className="py-2.5 px-2 text-center">مشرف ميداني</th>
                        <th className="py-2.5 px-2 text-center">مراقب / مطلع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modulesList.map((m) => {
                        const adminP = ROLE_PERMISSIONS.admin[m.key];
                        const opsP = ROLE_PERMISSIONS.ops_manager[m.key];
                        const finP = ROLE_PERMISSIONS.finance_officer[m.key];
                        const fieldP = ROLE_PERMISSIONS.field_officer[m.key];
                        const viewP = ROLE_PERMISSIONS.viewer[m.key];

                        const renderBadge = (p?: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean }) => {
                          if (!p || !p.view) {
                            return <span className="text-slate-300 font-mono text-[11px]">-</span>;
                          }
                          if (p.approve && p.delete) {
                            return (
                              <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                تحكم كامل
                              </span>
                            );
                          }
                          if (p.approve) {
                            return (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                اعتماد وتدقيق
                              </span>
                            );
                          }
                          if (p.create || p.edit) {
                            return (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                تسجيل وتعديل
                              </span>
                            );
                          }
                          return (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                              قراءة فقط
                            </span>
                          );
                        };

                        return (
                          <tr key={m.key} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 font-semibold text-slate-800">{m.label}</td>
                            <td className="py-2 px-2 text-center">{renderBadge(adminP)}</td>
                            <td className="py-2 px-2 text-center">{renderBadge(opsP)}</td>
                            <td className="py-2 px-2 text-center">{renderBadge(finP)}</td>
                            <td className="py-2 px-2 text-center">{renderBadge(fieldP)}</td>
                            <td className="py-2 px-2 text-center">{renderBadge(viewP)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    المستخدم النشط حالياً: <strong>{currentUser.name}</strong> ({ROLE_LABELS[currentUser.role]?.ar})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">جلسة محمية • تدقيق تلقائي لكافة العمليات</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 6: Database, Backup & Reset */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Live DB Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                حالة قاعدة البيانات والتخزين الحي
              </CardTitle>
              <p className="text-xs text-slate-500">ملخص حي للسجلات والبيانات المخزنة محلياً في ذاكرة التخزين الدائم للمتصفح</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                  <div className="text-lg font-black text-slate-900">{dbStats.tasksCount}</div>
                  <div className="text-[11px] font-semibold text-slate-500">مهمة تشغيلية</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                  <div className="text-lg font-black text-slate-900">{dbStats.fundsCount}</div>
                  <div className="text-[11px] font-semibold text-slate-500">صناديق عهد نقدية</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                  <div className="text-lg font-black text-slate-900">{dbStats.expensesCount}</div>
                  <div className="text-[11px] font-semibold text-slate-500">فواتير ومصروفات</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                  <div className="text-lg font-black text-slate-900">{dbStats.settlementsCount}</div>
                  <div className="text-[11px] font-semibold text-slate-500">سندات تسوية</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-600 p-2 bg-slate-50 rounded-lg">
                  <span>إجمالي مخصصات العهد:</span>
                  <span className="font-bold text-slate-900">
                    {dbStats.totalAllocation.toLocaleString()} {settings.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 p-2 bg-slate-50 rounded-lg">
                  <span>إجمالي المصروفات المنفذة:</span>
                  <span className="font-bold text-emerald-700">
                    {Math.round(dbStats.totalExpensesAmount).toLocaleString()} {settings.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 p-2 bg-slate-50 rounded-lg">
                  <span>حجم البيانات التقديري:</span>
                  <span className="font-bold text-slate-900">{dbStats.approximateSizeKb} KB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup & Restore Tools */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                أدوات النسخ الاحتياطي والاستعادة الكاملة
              </CardTitle>
              <p className="text-xs text-slate-500">
                يمكنك تحميل ملف نسخة احتياطية كامل لكافة الجداول والبيانات والسياسات، أو استعادتها في أي وقت
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {importStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    importStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {importStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  {importStatus.message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                    <Download className="w-4 h-4 text-indigo-600" />
                    تصدير نسخة احتياطية شاملة (JSON Backup)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    إنشاء وتحميل ملف JSON متكامل يتضمن كافة الصناديق، الفواتير، المهام، التسويات، وسجلات التدقيق.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleExportBackup}
                    icon={<Download className="w-3.5 h-3.5" />}
                    className="text-xs font-bold w-full"
                  >
                    تنزيل النسخة الاحتياطية الآن
                  </Button>
                </div>

                {/* Import */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    استعادة المنظومة من ملف نسخة احتياطية
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    استيراد ملف JSON تم تصديره مسبقاً لاستبدال واستعادة السجلات والإعدادات بدقة تامة.
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleImportFile}
                    className="hidden"
                    id="import-backup-file"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    icon={<Upload className="w-3.5 h-3.5 text-emerald-600" />}
                    className="text-xs font-bold w-full"
                  >
                    اختيار ملف النسخة الاحتياطية واستعادتها
                  </Button>
                </div>
              </div>

              {/* Reset to Demo Data */}
              <div className="pt-4 border-t border-slate-100">
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    إعادة ضبط وتحميل البيانات التجريبية الموسعة
                  </div>
                  <p className="text-[11px] text-amber-800/80 leading-relaxed">
                    يتيح لك هذا الخيار إعادة تعيين المنظومة فوراً إلى حالتها النموذجية الشاملة (8 مستخدمين بمختلف الأدوار، 6 صناديق عهد نقدية، 20 فاتورة متنوعة، 10 مهام كانبان، و5 تسويات مالية).
                  </p>

                  {resetSuccess && (
                    <div className="p-2.5 bg-emerald-100/70 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      تمت استعادة كافة البيانات النموذجية الشاملة بنجاح!
                    </div>
                  )}

                  {showResetConfirm ? (
                    <div className="p-3 bg-white rounded-lg border border-amber-300 space-y-2">
                      <p className="text-xs font-bold text-amber-950">
                        هل أنت متأكد من إعادة ضبط البيانات لجميع السجلات وإعادتها للوضع النموذجي؟
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          type="button"
                          onClick={handleResetData}
                          className="text-xs font-bold"
                        >
                          نعم، إعادة الضبط النموذجية
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="text-xs"
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      icon={<RefreshCw className="w-3.5 h-3.5 text-amber-600" />}
                      className="text-xs font-bold text-amber-900 border-amber-300 hover:bg-amber-100/50"
                    >
                      استعادة وتحميل كافة البيانات التجريبية الشاملة
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Floating/Fixed Save Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="text-xs text-slate-500">
          تُحفظ كافة التعديلات في التخزين الدائم للبيئة وتنعكس فوراً على كافة واجهات النظام.
        </div>
        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4" /> تم الحفظ بنجاح
            </span>
          )}
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={() => handleSave()}
            icon={<Save className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            حفظ كافة التغييرات
          </Button>
        </div>
      </div>
    </div>
  );
};
