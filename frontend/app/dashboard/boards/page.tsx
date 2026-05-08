'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Plus, LayoutGrid } from 'lucide-react';

interface Board {
  id: string;
  nameAr: string;
  type: string;
  scope: string;
  _count: { columns: number };
}

export default function BoardsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: boards = [] } = useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: () => api.get('/boards').then(r => r.data),
  });

  const { data: board } = useQuery<any>({
    queryKey: ['board', selectedId],
    queryFn: () => api.get(`/boards/${selectedId}`).then(r => r.data),
    enabled: !!selectedId,
  });

  const moveCard = useMutation({
    mutationFn: ({ cardId, columnId }: any) =>
      api.post(`/boards/cards/${cardId}/move`, { columnId, order: 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board'] }),
  });

  const addCard = useMutation({
    mutationFn: ({ columnId, title }: any) =>
      api.post(`/boards/columns/${columnId}/cards`, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board'] }),
  });

  const createBoard = useMutation({
    mutationFn: (nameAr: string) => api.post('/boards', { nameAr, type: 'TASK' }),
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['boards'] });
      setSelectedId(r.data.id);
      setShowCreate(false);
    },
  });

  if (!selectedId) {
    return (
      <div className="space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">لوحات Kanban</h1>
            <p className="text-slate-500 mt-1">{boards.length} لوحة</p>
          </div>
          {hasPermission('boards.create') && (
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1">
              <Plus size={14} /> لوحة جديدة
            </button>
          )}
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {boards.length === 0 ? (
            <div className="col-span-full card text-center py-12 text-slate-400">
              لا توجد لوحات. أنشئ أول لوحة Kanban.
            </div>
          ) : boards.map((b) => (
            <button key={b.id} onClick={() => setSelectedId(b.id)}
              className="card text-right hover:border-primary hover:shadow-md transition">
              <LayoutGrid size={20} className="text-primary mb-2" />
              <div className="font-semibold">{b.nameAr}</div>
              <div className="text-xs text-slate-500 mt-1">
                {b.type} · {b._count.columns} عمود
              </div>
            </button>
          ))}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
            <div className="card w-full max-w-sm">
              <h3 className="font-semibold mb-3">لوحة جديدة</h3>
              <input id="board-name" className="input" placeholder="اسم اللوحة" />
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setShowCreate(false)} className="btn-secondary">إلغاء</button>
                <button onClick={() => {
                  const name = (document.getElementById('board-name') as HTMLInputElement).value;
                  if (name) createBoard.mutate(name);
                }} className="btn-primary">إنشاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!board) return <div className="text-slate-500 text-center py-8">جارٍ التحميل...</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <button onClick={() => setSelectedId(null)} className="text-primary text-sm hover:underline mb-2">
            ← العودة للوحات
          </button>
          <h1 className="text-2xl font-bold">{board.nameAr}</h1>
        </div>
      </header>

      <div className="overflow-x-auto pb-3">
        <div className="flex gap-3 min-w-max">
          {board.columns.map((col: any) => (
            <div key={col.id} className="w-72 shrink-0">
              <div className="rounded-t-lg p-3 font-semibold text-sm flex items-center justify-between" style={{ backgroundColor: col.color + '20', color: col.color }}>
                <span>{col.nameAr}</span>
                <span className="badge bg-white text-slate-600 text-xs">{col.cards.length}</span>
              </div>
              <div className="bg-slate-50 rounded-b-lg p-2 min-h-[300px] space-y-2">
                {col.cards.map((c: any) => (
                  <div key={c.id} draggable
                    onDragStart={(e) => e.dataTransfer.setData('cardId', c.id)}
                    className="card cursor-grab active:cursor-grabbing text-sm">
                    <div className="font-medium">{c.title}</div>
                    {c.description && <div className="text-xs text-slate-500 mt-1">{c.description}</div>}
                    {c.dueDate && (
                      <div className="text-xs text-slate-400 mt-1">
                        📅 {new Date(c.dueDate).toLocaleDateString('ar-SA')}
                      </div>
                    )}
                  </div>
                ))}

                <div onDrop={(e) => {
                  e.preventDefault();
                  const cardId = e.dataTransfer.getData('cardId');
                  if (cardId) moveCard.mutate({ cardId, columnId: col.id });
                }} onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-slate-200 rounded p-2 text-xs text-center text-slate-400">
                  اسحب البطاقة هنا
                </div>

                <button onClick={() => {
                  const t = prompt('عنوان البطاقة');
                  if (t) addCard.mutate({ columnId: col.id, title: t });
                }} className="w-full text-sm text-slate-500 hover:bg-slate-100 rounded p-2 mt-2">
                  + بطاقة
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
