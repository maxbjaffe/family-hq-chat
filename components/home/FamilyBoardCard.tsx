'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Pin, Plus, FileText, Trash2, X, Loader2, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BoardItem {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  storage_path: string;
  created_at: string;
}

export function FamilyBoardCard({ className }: { className?: string }) {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<BoardItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/board');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('[Board] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxItem) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxItem]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/board', { method: 'POST', body: form });
      if (res.ok) {
        const data = await res.json();
        setItems(prev => [data.item, ...prev]);
      }
    } catch (err) {
      console.error('[Board] Upload error:', err);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic removal
    setItems(prev => prev.filter(i => i.id !== id));
    setLightboxItem(null);
    try {
      await fetch(`/api/board?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('[Board] Delete error:', err);
      fetchItems(); // refetch on error
    }
  };

  const handleEditSave = async (id: string) => {
    const trimmed = editValue.trim();
    setEditingId(null);

    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, title: trimmed } : i));
    if (lightboxItem?.id === id) {
      setLightboxItem(prev => prev ? { ...prev, title: trimmed } : null);
    }

    try {
      await fetch('/api/board', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: trimmed }),
      });
    } catch (err) {
      console.error('[Board] Edit error:', err);
      fetchItems();
    }
  };

  const startEdit = (item: BoardItem) => {
    setEditingId(item.id);
    setEditValue(item.title);
  };

  const handleClick = (item: BoardItem) => {
    if (item.file_type === 'application/pdf') {
      window.open(item.file_url, '_blank');
    } else {
      setLightboxItem(item);
    }
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <>
      <Card className={`bg-gradient-to-br from-slate-50 to-stone-50 p-5 border-2 border-dashed border-slate-200 flex flex-col ${className ?? ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800">📌 Family Board</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : 'Add'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="min-h-[120px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : items.length === 0 ? (
          <div className="min-h-[120px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Pin className="h-6 w-6 text-slate-300" />
              <p className="text-slate-500 font-medium text-sm">Nothing pinned yet</p>
              <p className="text-sm text-slate-400">Tap + to add a flyer or document</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map(item => (
              <div key={item.id} className="group relative">
                {/* Thumbnail */}
                <button
                  onClick={() => handleClick(item)}
                  className="w-full aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {isImage(item.file_type) ? (
                    <img
                      src={item.file_url}
                      alt={item.title || 'Board item'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                      <FileText className="h-8 w-8 text-slate-400" />
                      <span className="text-xs text-slate-500 text-center line-clamp-2 break-all">
                        {item.title || item.storage_path.split('/').pop()}
                      </span>
                    </div>
                  )}
                </button>

                {/* Delete button — visible on hover/tap */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Caption */}
                {editingId === item.id ? (
                  <input
                    ref={editInputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleEditSave(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave(item.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="mt-1 w-full text-xs px-1 py-0.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(item)}
                    className="mt-1 w-full text-left text-xs text-slate-600 truncate hover:text-blue-600 flex items-center gap-0.5 min-h-[20px]"
                    title="Click to edit caption"
                  >
                    <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 shrink-0" />
                    <span className="truncate">{item.title || 'Add caption...'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            <img
              src={lightboxItem.file_url}
              alt={lightboxItem.title || 'Board item'}
              className="max-h-[75vh] w-auto rounded-lg object-contain"
            />

            {/* Caption + actions */}
            <div className="mt-3 flex items-center gap-3">
              {editingId === lightboxItem.id ? (
                <input
                  ref={editInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleEditSave(lightboxItem.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSave(lightboxItem.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="text-sm px-2 py-1 rounded bg-white/10 text-white border border-white/30 focus:outline-none focus:ring-1 focus:ring-white/50 min-w-[200px]"
                />
              ) : (
                <button
                  onClick={() => startEdit(lightboxItem)}
                  className="text-sm text-white/80 hover:text-white flex items-center gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  {lightboxItem.title || 'Add caption...'}
                </button>
              )}
              <button
                onClick={() => handleDelete(lightboxItem.id)}
                className="p-1.5 rounded-full text-white/60 hover:text-red-400 hover:bg-white/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
