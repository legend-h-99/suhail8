'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { Send, Sparkles, MessageCircle } from 'lucide-react';

export default function ChatbotPage() {
  const qc = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ['ai-conversations'],
    queryFn: () => api.get('/ai/conversations').then(r => r.data),
  });

  const { data: conv } = useQuery<any>({
    queryKey: ['ai-conv', conversationId],
    queryFn: () => api.get(`/ai/conversations/${conversationId}`).then(r => r.data),
    enabled: !!conversationId,
  });

  const send = useMutation({
    mutationFn: (msg: string) =>
      api.post('/ai/chat', { conversationId, message: msg }).then(r => r.data),
    onSuccess: (r: any) => {
      setConversationId(r.conversationId);
      setInput('');
      qc.invalidateQueries({ queryKey: ['ai-conversations'] });
      qc.invalidateQueries({ queryKey: ['ai-conv', r.conversationId] });
    },
  });

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [conv]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-100px)]">
      {/* Conversations sidebar */}
      <div className="lg:col-span-1 card overflow-y-auto">
        <button onClick={() => setConversationId(null)}
          className="btn-primary w-full mb-3 flex items-center gap-1 justify-center">
          <Sparkles size={14} /> محادثة جديدة
        </button>
        <h3 className="text-xs text-slate-500 mb-2">المحادثات السابقة</h3>
        <ul className="space-y-1">
          {conversations.map((c: any) => (
            <li key={c.id}>
              <button onClick={() => setConversationId(c.id)}
                className={`w-full text-right p-2 rounded text-sm hover:bg-slate-100 ${
                  conversationId === c.id ? 'bg-primary-50 text-primary-700' : ''
                }`}>
                <div className="font-medium truncate">{c.title}</div>
                <div className="text-xs text-slate-400">{c._count.messages} رسالة</div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat area */}
      <div className="lg:col-span-3 card flex flex-col h-full">
        <div ref={messagesRef} className="flex-1 overflow-y-auto space-y-3 mb-3">
          {!conv && !conversationId && (
            <div className="text-center text-slate-400 py-12">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
              <p>اسأل المساعد الذكي عن المهام، الصلاحيات، التقارير، أو أي شيء آخر.</p>
              <div className="mt-4 grid grid-cols-2 gap-2 max-w-md mx-auto">
                {['ما هي مهامي اليوم؟', 'كيف أنشئ تقرير ربعي؟', 'لخّص لي لوحة الجودة', 'ما هي صلاحيات وكيل الجودة؟'].map((q) => (
                  <button key={q} onClick={() => { setInput(q); }} className="text-sm p-2 rounded bg-slate-100 hover:bg-slate-200">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {conv?.messages?.map((m: any) => (
            <div key={m.id} className={`flex ${m.role === 'USER' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                m.role === 'USER'
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                <div className="text-xs opacity-60 mt-1">
                  {new Date(m.createdAt).toLocaleTimeString('ar-SA')}
                </div>
              </div>
            </div>
          ))}
          {send.isPending && (
            <div className="flex justify-end">
              <div className="bg-slate-100 p-3 rounded-2xl">
                <span className="animate-pulse">⏳ المساعد يفكر...</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (input) send.mutate(input); }}
          className="flex gap-2">
          <input className="input flex-1" placeholder="اكتب رسالتك..."
            value={input} onChange={(e) => setInput(e.target.value)} />
          <button type="submit" disabled={!input || send.isPending}
            className="btn-primary flex items-center gap-1">
            <Send size={14} />
            إرسال
          </button>
        </form>
      </div>
    </div>
  );
}
