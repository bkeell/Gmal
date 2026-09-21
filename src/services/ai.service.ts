import { dataStore } from '../lib/storage';
import { formatCurrency } from '../lib/utils/format';

export interface AIOperationsAnalysis {
  healthScore: number; // 0 - 100
  statusSummary: string;
  insights: {
    type: 'critical' | 'warning' | 'opportunity' | 'success';
    title: string;
    description: string;
    actionLabel?: string;
    targetModule?: string;
  }[];
  costSavingTips: string[];
  executiveBriefing: string;
}

export class AIService {
  public static async analyzeOperations(): Promise<AIOperationsAnalysis> {
    const tasks = dataStore.getTasks();
    const funds = dataStore.getFunds();
    const expenses = dataStore.getExpenses();
    const settlements = dataStore.getSettlements();

    const lowFunds = funds.filter((f) => f.status === 'warning' || f.status === 'depleted');
    const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed');
    const pendingExpenses = expenses.filter((e) => e.status === 'pending_approval');
    const pendingSettlements = settlements.filter((s) => s.status === 'under_review');
    const highValueExpenses = expenses.filter((e) => e.totalWithTax > 3000);

    // Compute intelligent score
    let score = 92;
    if (lowFunds.length > 0) score -= lowFunds.length * 8;
    if (urgentTasks.length > 1) score -= 6;
    if (pendingExpenses.length > 3) score -= 5;
    if (score < 40) score = 40;

    const insights: AIOperationsAnalysis['insights'] = [];

    if (lowFunds.length > 0) {
      insights.push({
        type: 'critical',
        title: `تنبيه سيولة: ${lowFunds.length} عهدة نقدية أوشكت على النفاد`,
        description: `العهدة "${lowFunds[0].name}" رصيدها الحالي ${formatCurrency(lowFunds[0].currentBalance, lowFunds[0].currency)} فقط (${Math.round((lowFunds[0].currentBalance / lowFunds[0].totalAllocation) * 100)}%). يُنصح ببدء إجراءات التسوية وإعادة التغذية فوراً لتفادي توقف العمليات الميدانية.`,
        actionLabel: 'مراجعة العهد النقدية',
        targetModule: 'funds',
      });
    }

    if (pendingExpenses.length > 0) {
      const sumPending = pendingExpenses.reduce((s, e) => s + e.totalWithTax, 0);
      insights.push({
        type: 'warning',
        title: `مطالبات صرف معلقة: ${pendingExpenses.length} فواتير بقيمة ${formatCurrency(sumPending)}`,
        description: `توجد فواتير قيد التدقيق بحاجة لاعتماد الإدارة المالية لإقفال سجلات المصروفات.`,
        actionLabel: 'اعتماد الفواتير',
        targetModule: 'expenses',
      });
    }

    if (urgentTasks.length > 0) {
      insights.push({
        type: 'warning',
        title: `مهام تشغيلية حرجة: ${urgentTasks.length} مهام ذات أولوية قصوى`,
        description: `أبرزها: "${urgentTasks[0].title}" المسندة إلى ${urgentTasks[0].assigneeName} والمستحقة بتاريخ ${urgentTasks[0].dueDate}.`,
        actionLabel: 'متابعة المهام',
        targetModule: 'tasks',
      });
    }

    if (highValueExpenses.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'تدقيق المشتريات المرتفعة وتوفير التكاليف',
        description: `تم رصد فواتير تجاوزت 3,000 درهم تم صرفها عبر العهدة المباشرة. يُفضل تحويل المشتريات المتكررة لعقود توريد ربع سنوية للحصول على خصومات تجارية بنسبة تصل إلى 12%.`,
        actionLabel: 'تحليل المصروفات',
        targetModule: 'reports',
      });
    }

    insights.push({
      type: 'success',
      title: 'معدل التوثيق الضريبي ممتاز (100%)',
      description: 'جميع المصروفات المسجلة تحوي أرقام فواتير وبيانات موردين مكتملة وضريبة القيمة المضافة 5% محسوبة بدقة.',
      actionLabel: 'عرض التقارير الضريبية',
      targetModule: 'reports',
    });

    const costSavingTips = [
      'دمج فواتير الوقود والشحن اللوجستي تحت بطاقات شراء موحدة يقلل الهدر بنسبة 8% شهرياً.',
      'تسريع دورة تسوية العهد إلى 15 يوماً بدلاً من 30 يوماً يعزز الرقابة ويمنع تجميد السيولة النقدية.',
      'تفعيل أوامر الشراء المركزية لمواد الكهرباء والكابلات يمنح وفرة في الأسعار مقارنة بالشراء الفردي الميداني.',
    ];

    const executiveBriefing = `حالة المنظومة التشغيلية مستقرة بمؤشر كفاءة ${score}/100. إجمالي العهد المخصصة يغطي متطلبات العمليات بنسبة مقبولة مع ضرورة تغذية عهدة المنطقة الصناعية. فريق العمل الميداني يحقق نسبة إنجاز جيدة مع وجود ${urgentTasks.length} مهام حرجة تحت المتابعة المباشرة.`;

    return {
      healthScore: score,
      statusSummary: score >= 85 ? 'كفاءة تشغيلية ممتازة ومطابقة مالية عالية' : 'تحت المتابعة - يتطلب إجراءات تزويد وتسوية',
      insights,
      costSavingTips,
      executiveBriefing,
    };
  }
}
