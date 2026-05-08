'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Sparkles, FileText, Tag, BarChart3, BookOpen } from 'lucide-react';

export default function AiCenterPage() {
  const [tab, setTab] = useState<'summarize' | 'classify' | 'kpis' | 'analyze' | 'story'>('summarize');

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="text-amber-500" /> مركز الذكاء الاصطناعي
        </h1>
        <p className="text-slate-500 mt-1">تلخيص + تصنيف + اقتراح KPIs + تحليل + توليد User Stories</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { v: 'summarize', label: 'تلخيص', icon: FileText },
          { v: 'classify', label: 'تصنيف', icon: Tag },
          { v: 'kpis', label: 'اقتراح KPIs', icon: BarChart3 },
          { v: 'analyze', label: 'تحليل أداء', icon: BarChart3 },
          { v: 'story', label: 'User Story', icon: BookOpen },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.v} onClick={() => setTab(t.v as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm ${
                tab === t.v ? 'bg-primary text-white' : 'bg-white border border-slate-200'
              }`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'summarize' && <SummarizeTab />}
      {tab === 'classify' && <ClassifyTab />}
      {tab === 'kpis' && <KpisTab />}
      {tab === 'analyze' && <AnalyzeTab />}
      {tab === 'story' && <StoryTab />}
    </div>
  );
}

function SummarizeTab() {
  const [text, setText] = useState('');
  const m = useMutation({
    mutationFn: () => api.post('/ai/summarize', { text }).then(r => r.data),
  });
  return (
    <div className="card">
      <label className="label">النص</label>
      <textarea className="input" rows={6} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="ألصق التقرير أو المحضر هنا..." />
      <button onClick={() => m.mutate()} className="btn-primary mt-3" disabled={!text || m.isPending}>
        {m.isPending ? 'جارٍ التلخيص...' : 'لخّص'}
      </button>
      {m.data && (
        <div className="mt-4 p-3 bg-amber-50 rounded">
          <div className="text-xs text-amber-700 mb-1">
            🤖 الطريقة: {m.data.method === 'openai' ? 'OpenAI' : 'fallback (rule-based)'}
          </div>
          <pre className="text-sm whitespace-pre-wrap">{m.data.summary}</pre>
        </div>
      )}
    </div>
  );
}

function ClassifyTab() {
  const [text, setText] = useState('');
  const m = useMutation({
    mutationFn: () => api.post('/ai/classify', { text }).then(r => r.data),
  });
  return (
    <div className="card">
      <label className="label">النص للتصنيف</label>
      <textarea className="input" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={() => m.mutate()} className="btn-primary mt-3" disabled={!text || m.isPending}>
        {m.isPending ? 'جارٍ التصنيف...' : 'صنّف'}
      </button>
      {m.data && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <div className="text-xs text-blue-700 mb-1">🤖 {m.data.method}</div>
          <div className="font-bold text-lg">{m.data.category}</div>
          <div className="text-sm">الثقة: {(m.data.confidence * 100).toFixed(0)}%</div>
        </div>
      )}
    </div>
  );
}

function KpisTab() {
  const [unit, setUnit] = useState('');
  const m = useMutation({
    mutationFn: () => api.post('/ai/suggest-kpis', { unitNameAr: unit }).then(r => r.data),
  });
  return (
    <div className="card">
      <label className="label">اسم الوحدة</label>
      <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)}
        placeholder="مثال: وحدة الرقابة" />
      <button onClick={() => m.mutate()} className="btn-primary mt-3" disabled={!unit || m.isPending}>
        {m.isPending ? 'جارٍ...' : 'اقترح KPIs'}
      </button>
      {m.data && (
        <div className="mt-4 space-y-2">
          {m.data.suggestions.map((k: any, i: number) => (
            <div key={i} className="p-3 bg-slate-50 rounded">
              <div className="text-xs font-mono text-slate-400">{k.code}</div>
              <div className="font-semibold">{k.nameAr}</div>
              <div className="text-xs text-slate-500">الهدف: {k.target} {k.unit}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyzeTab() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['ai-analyze'],
    queryFn: () => api.get('/ai/analyze-performance').then(r => r.data),
  });
  if (isLoading) return <div className="card text-center py-8 text-slate-500">جارٍ التحليل...</div>;
  return (
    <div className="space-y-4">
      <div className="card bg-amber-50 border-amber-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-amber-600" />
          <strong>ملخص AI:</strong>
        </div>
        <p className="text-sm">{data?.summary}</p>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-right text-xs">المؤشر</th>
              <th className="p-2 text-right text-xs">القيمة</th>
              <th className="p-2 text-right text-xs">الهدف</th>
              <th className="p-2 text-right text-xs">الاتجاه</th>
              <th className="p-2 text-right text-xs">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {data?.analysis?.map((a: any, i: number) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="p-2 font-medium">{a.kpi}</td>
                <td className="p-2 font-mono">{a.lastValue ?? '—'}</td>
                <td className="p-2 font-mono">{a.target ?? '—'}</td>
                <td className="p-2">{a.trend}</td>
                <td className="p-2 text-xs">{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StoryTab() {
  const [role, setRole] = useState('');
  const [feature, setFeature] = useState('');
  const m = useMutation({
    mutationFn: () => api.post('/ai/user-story', { role, feature }).then(r => r.data),
  });
  return (
    <div className="card">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">الدور</label>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="مثال: عميد" />
        </div>
        <div>
          <label className="label">الميزة</label>
          <input className="input" value={feature} onChange={(e) => setFeature(e.target.value)} placeholder="مثال: عرض كل مؤشرات الجودة" />
        </div>
      </div>
      <button onClick={() => m.mutate()} className="btn-primary mt-3" disabled={!role || !feature || m.isPending}>
        {m.isPending ? 'جارٍ التوليد...' : 'ولّد User Story'}
      </button>
      {m.data && (
        <div className="mt-4 p-3 bg-emerald-50 rounded">
          <pre className="text-sm whitespace-pre-wrap">{m.data.story}</pre>
        </div>
      )}
    </div>
  );
}
