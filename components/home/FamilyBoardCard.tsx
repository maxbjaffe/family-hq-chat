'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Pin, Plus, Trash2, X, Loader2, Pencil, ZoomIn, ZoomOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { BOARD_LOGOS, getLogoByType, type BoardLogoType } from '@/lib/board-logos';

interface BoardItem {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  storage_path: string;
  icon_type: string | null;
  created_at: string;
}

export function FamilyBoardCard({ className }: { className?: string }) {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<BoardItem | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
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
      if (e.key === 'Escape') {
        setLightboxItem(null);
        setZoomed(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxItem]);

  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowLogoPicker(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogoSelect = async (logoType: BoardLogoType) => {
    if (!pendingFile) return;
    setShowLogoPicker(false);
    const file = pendingFile;
    setPendingFile(null);

    setUploading(true);
    setError(null);
    try {
      // Step 1: Get signed upload URL from our API
      const initRes = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, title: '', icon_type: logoType }),
      });
      if (!initRes.ok) {
        const errData = await initRes.json().catch(() => ({ error: initRes.statusText }));
        setError(errData.error || `Init failed (${initRes.status})`);
        return;
      }
      const { signedUrl, storagePath, publicUrl, fileType, title, icon_type } = await initRes.json();

      // Step 2: Upload directly to Supabase Storage (bypasses Vercel size limit)
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) {
        setError(`Storage upload failed (${uploadRes.status})`);
        return;
      }

      // Step 3: Confirm upload — create DB row
      const confirmRes = await fetch('/api/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath, publicUrl, fileType, title, icon_type }),
      });
      if (confirmRes.ok) {
        const data = await confirmRes.json();
        setItems(prev => [data.item, ...prev]);
      } else {
        const errData = await confirmRes.json().catch(() => ({ error: confirmRes.statusText }));
        setError(errData.error || `Confirm failed (${confirmRes.status})`);
      }
    } catch (err) {
      console.error('[Board] Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setLightboxItem(null);
    setZoomed(false);
    try {
      await fetch(`/api/board?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('[Board] Delete error:', err);
      fetchItems();
    }
  };

  const handleEditSave = async (id: string) => {
    const trimmed = editValue.trim();
    setEditingId(null);

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
      setZoomed(false);
    }
  };

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
            onChange={handleFileSelected}
            className="hidden"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
            {error}
          </div>
        )}

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
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {items.map(item => {
              const logo = getLogoByType(item.icon_type);
              return (
                <div key={item.id} className="group relative">
                  {/* Thumbnail — show logo instead of raw image */}
                  <button
                    onClick={() => handleClick(item)}
                    className="w-full aspect-square rounded-md overflow-hidden bg-white border border-slate-200 hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <img
                      src={logo.imagePath}
                      alt={logo.label}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>

                  {/* Delete button — visible on hover/tap */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
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
                      className="mt-0.5 w-full text-[10px] px-1 py-0.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(item)}
                      className="mt-0.5 w-full text-left text-[10px] text-slate-500 truncate hover:text-blue-600 flex items-center gap-0.5 min-h-[16px] leading-tight"
                      title="Click to edit caption"
                    >
                      <span className="truncate">{item.title || 'Caption...'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Logo Picker Modal */}
      {showLogoPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => { setShowLogoPicker(false); setPendingFile(null); }}
        >
          <div
            className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-800 mb-3 text-center">Choose a logo</h3>
            <div className="grid grid-cols-3 gap-3">
              {BOARD_LOGOS.map(logo => (
                <button
                  key={logo.type}
                  onClick={() => handleLogoSelect(logo.type)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <img src={logo.imagePath} alt={logo.label} className="w-16 h-16 object-contain" />
                  <span className="text-[10px] text-slate-600 text-center leading-tight">{logo.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowLogoPicker(false); setPendingFile(null); }}
              className="mt-4 w-full text-sm text-slate-500 hover:text-slate-700 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Lightbox with zoom */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => { setLightboxItem(null); setZoomed(false); }}
        >
          <div
            className={`relative w-full flex flex-col items-center ${zoomed ? 'max-w-none max-h-none overflow-auto' : 'max-w-3xl max-h-[90vh]'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => { setLightboxItem(null); setZoomed(false); }}
              className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image — click to toggle zoom */}
            <img
              src={lightboxItem.file_url}
              alt={lightboxItem.title || 'Board item'}
              onClick={() => setZoomed(!zoomed)}
              className={`rounded-lg cursor-zoom-in ${zoomed ? 'max-w-none w-auto' : 'max-h-[75vh] w-auto object-contain cursor-zoom-in'}`}
              style={zoomed ? { cursor: 'zoom-out' } : undefined}
            />

            {/* Caption + actions — hidden when zoomed */}
            {!zoomed && (
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
                  onClick={() => setZoomed(true)}
                  className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(lightboxItem.id)}
                  className="p-1.5 rounded-full text-white/60 hover:text-red-400 hover:bg-white/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Zoom out button — shown when zoomed */}
            {zoomed && (
              <button
                onClick={() => setZoomed(false)}
                className="fixed bottom-6 right-6 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors text-sm backdrop-blur-sm"
              >
                <ZoomOut className="h-4 w-4" />
                Fit to screen
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
