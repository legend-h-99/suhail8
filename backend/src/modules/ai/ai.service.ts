import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenancyService } from '../../tenancy/tenancy.service';

/**
 * AI Service — يدعم تشغيل OpenAI الفعلي (إن كان OPENAI_API_KEY متوفراً)
 * أو fallback ذكي بدون مفتاح.
 *
 * الميزات:
 *   - تلخيص: نص → ملخص قصير
 *   - تصنيف: نص → فئة (مهمة، طلب، شكوى، استفسار)
 *   - اقتراح KPIs لوحدة معينة
 *   - تحليل أداء (KPIs trends)
 *   - توليد user story
 *   - دردشة عامة (Chatbot)
 */
@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
  ) {}

  private async callOpenAI(messages: { role: string; content: string }[]): Promise<string | null> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.5, max_tokens: 600 }),
      });
      if (!res.ok) return null;
      const data: any = await res.json();
      return data.choices?.[0]?.message?.content ?? null;
    } catch {
      return null;
    }
  }

  // ─────────── 1. Summarize ───────────
  async summarize(text: string): Promise<{ summary: string; method: 'openai' | 'rule_based' }> {
    const ai = await this.callOpenAI([
      { role: 'system', content: 'أنت مساعد ذكي. لخّص النص التالي إلى ٣-٥ نقاط رئيسية بالعربية.' },
      { role: 'user', content: text },
    ]);
    if (ai) return { summary: ai, method: 'openai' };

    // fallback rule-based — يأخذ أول 3 جمل + يضع نقاط
    const sentences = text.split(/[.،!؟]+/).filter((s) => s.trim().length > 20).slice(0, 5);
    const summary = sentences.length > 0
      ? sentences.map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')
      : 'النص قصير جداً للتلخيص.';
    return { summary, method: 'rule_based' };
  }

  // ─────────── 2. Classify ───────────
  async classify(text: string): Promise<{ category: string; confidence: number; method: 'openai' | 'rule_based' }> {
    const ai = await this.callOpenAI([
      { role: 'system', content: 'صنّف النص لواحد من: TASK, REQUEST, COMPLAINT, INQUIRY, OTHER. أعطني JSON فقط: {"category":"...","confidence":0.0-1.0}' },
      { role: 'user', content: text },
    ]);
    if (ai) {
      try {
        const parsed = JSON.parse(ai.match(/\{[^}]+\}/)?.[0] ?? '{}');
        if (parsed.category) return { ...parsed, method: 'openai' };
      } catch {}
    }

    // fallback keyword-based
    const t = text.toLowerCase();
    let category = 'OTHER';
    if (t.includes('شكوى') || t.includes('سيء') || t.includes('مشكلة')) category = 'COMPLAINT';
    else if (t.includes('طلب') || t.includes('أحتاج') || t.includes('أرجو')) category = 'REQUEST';
    else if (t.includes('متى') || t.includes('كيف') || t.includes('ما') || t.includes('استفسار')) category = 'INQUIRY';
    else if (t.includes('مهمة') || t.includes('تنفيذ') || t.includes('عمل')) category = 'TASK';
    return { category, confidence: 0.7, method: 'rule_based' };
  }

  // ─────────── 3. Suggest KPIs ───────────
  async suggestKpis(unitNameAr: string): Promise<{ suggestions: any[]; method: string }> {
    const ai = await this.callOpenAI([
      { role: 'system', content: 'اقترح 5 KPIs (مؤشرات أداء) لوحدة إدارية. أعطني JSON array: [{"code":"...","nameAr":"...","unit":"...","target":number}]' },
      { role: 'user', content: `الوحدة: ${unitNameAr}` },
    ]);
    if (ai) {
      try {
        const match = ai.match(/\[[\s\S]+\]/);
        if (match) return { suggestions: JSON.parse(match[0]), method: 'openai' };
      } catch {}
    }

    // fallback مكتبة جاهزة
    const lib: Record<string, any[]> = {
      default: [
        { code: 'COMPLETION_RATE', nameAr: 'نسبة إنجاز المهام', unit: '%', target: 90 },
        { code: 'RESPONSE_TIME', nameAr: 'وقت الاستجابة المتوسط', unit: 'يوم', target: 2 },
        { code: 'SATISFACTION', nameAr: 'نسبة رضا المستفيدين', unit: '%', target: 85 },
        { code: 'COMPLIANCE', nameAr: 'نسبة الالتزام بالأنظمة', unit: '%', target: 95 },
        { code: 'EFFICIENCY', nameAr: 'كفاءة استخدام الموارد', unit: '%', target: 80 },
      ],
    };
    return { suggestions: lib.default, method: 'rule_based' };
  }

  // ─────────── 4. Analyze Performance ───────────
  async analyzePerformance() {
    const tenantId = this.tenancy.getTenantId();
    const kpis = await this.prisma.kpi.findMany({
      where: { tenantId },
      include: { measurements: { orderBy: { period: 'desc' }, take: 6 } },
    });

    const analysis = kpis.map((k) => {
      const last = k.measurements[0];
      const prev = k.measurements[1];
      if (!last) return { kpi: k.nameAr, status: 'no_data' };
      const lastVal = Number(last.value);
      const target = k.target ? Number(k.target) : null;
      const trend = prev ? ((lastVal - Number(prev.value)) / Number(prev.value)) * 100 : null;
      const onTrack = target ? lastVal >= target * 0.9 : null;
      return {
        kpi: k.nameAr,
        lastValue: lastVal,
        target,
        trend: trend !== null ? `${trend.toFixed(1)}%` : '—',
        status: onTrack === null ? 'no_target' : onTrack ? '✅ على المسار' : '⚠️ يحتاج تدخل',
      };
    });

    const aiSummary = `لدينا ${kpis.length} مؤشر. ${analysis.filter((a) => a.status?.includes('✅')).length} على المسار، ${analysis.filter((a) => a.status?.includes('⚠️')).length} يحتاج تدخل.`;

    return { analysis, summary: aiSummary };
  }

  // ─────────── 5. Generate User Story ───────────
  async generateUserStory(role: string, feature: string) {
    const ai = await this.callOpenAI([
      { role: 'system', content: 'أنشئ user story احترافية بالعربية بالصيغة: "بصفتي [دور]، أريد [ميزة]، حتى [فائدة]"' },
      { role: 'user', content: `الدور: ${role}\nالميزة: ${feature}` },
    ]);
    if (ai) return { story: ai, method: 'openai' };
    return {
      story: `بصفتي ${role}، أريد ${feature}، حتى أحقق هدفي بفعالية وكفاءة.`,
      method: 'rule_based',
    };
  }

  // ─────────── 6. Chatbot ───────────
  async chat(userId: string, conversationId: string | null, userMessage: string) {
    const tenantId = this.tenancy.getTenantId();

    let conv;
    if (conversationId) {
      conv = await this.prisma.aIConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }
    if (!conv) {
      conv = await this.prisma.aIConversation.create({
        data: { tenantId, userId, title: userMessage.slice(0, 30) },
        include: { messages: true },
      });
    }

    // أحفظ رسالة المستخدم
    await this.prisma.aIMessage.create({
      data: { conversationId: conv.id, role: 'USER', content: userMessage },
    });

    // أبني context للنموذج
    const systemPrompt = `أنت مساعد ذكي لنظام ERP لكلية الاتصالات والمعلومات بالرياض.
تساعد المستخدمين في:
- شرح المهام والصلاحيات
- البحث في التقارير
- إنشاء مهام أو مشاريع
- اقتراح قرارات وتحليلات
- تلخيص التقارير
رد دائماً بالعربية وبشكل ودي ومختصر.`;

    const history = (conv as any).messages?.map((m: any) => ({
      role: m.role.toLowerCase(),
      content: m.content,
    })) ?? [];

    const ai = await this.callOpenAI([
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ]);

    let reply = ai;
    if (!reply) {
      // fallback rule-based
      reply = this.fallbackChatReply(userMessage);
    }

    await this.prisma.aIMessage.create({
      data: { conversationId: conv.id, role: 'ASSISTANT', content: reply },
    });

    return { conversationId: conv.id, reply };
  }

  private fallbackChatReply(message: string): string {
    const m = message.toLowerCase();
    if (m.includes('مرحبا') || m.includes('السلام') || m.includes('اهلا')) {
      return 'مرحباً بك في نظام إدارة الكلية! كيف أقدر أساعدك اليوم؟';
    }
    if (m.includes('مهمة') || m.includes('مهام')) {
      return 'يمكنك إنشاء مهام من شاشة "نظام المهام". تبي أساعدك بإنشاء مهمة؟';
    }
    if (m.includes('تقرير')) {
      return 'تقاريرك متاحة في "مركز التقارير". يمكنك طلب تقرير ربعي أو سنوي وحفظه PDF.';
    }
    if (m.includes('صلاحية') || m.includes('صلاحيات')) {
      return 'لمعرفة صلاحياتك بالضبط افتح "اختبار الوصول" في الإدارة. ستجد كل شاشة وكل صلاحية.';
    }
    if (m.includes('مشروع') || m.includes('مشاريع')) {
      return 'افتح "نظام المشاريع" لإنشاء مشروع جديد، إضافة أعضاء، ومتابعة المراحل.';
    }
    if (m.includes('kpi') || m.includes('مؤشر')) {
      return 'مؤشرات الأداء تجدها في "لوحة الجودة". وأقدر أقترح لك مؤشرات مناسبة لوحدتك.';
    }
    return 'شكراً سؤالك! نظام الذكاء الاصطناعي يعمل في وضع الـ fallback (بدون OpenAI). أضف OPENAI_API_KEY في .env لتفعيل الردود الذكية الكاملة.';
  }

  listConversations(userId: string) {
    return this.prisma.aIConversation.findMany({
      where: { userId },
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  getConversation(id: string, userId: string) {
    return this.prisma.aIConversation.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }
}
