"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Users,
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  BarChart3,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Video,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { IconPicker } from "@/components/IconPicker";

interface ChecklistItem {
  id: string;
  title: string;
  icon: string | null;
  display_order: number;
  weekdays_only: boolean;
  is_active: boolean;
}

interface Child {
  id: string;
  name: string;
  age: number | null;
  grade: string | null;
  avatar_type: string | null;
  avatar_data: string | null;
  checklist_items: ChecklistItem[];
}

interface MediaFile {
  name: string;
  path: string;
  url: string;
  category: string;
  created_at?: string;
}

interface AnalyticsSummary {
  total_queries: number;
  avg_response_time_ms: number;
  queries_today: number;
  top_queries: { query: string; count: number }[];
}

type Tab = "children" | "media" | "analytics";
type MediaCategory = "avatars" | "celebrations" | "icons" | "backgrounds" | "general";

const MEDIA_CATEGORIES: { value: MediaCategory; label: string; icon: React.ElementType }[] = [
  { value: "avatars", label: "Avatars", icon: User },
  { value: "celebrations", label: "Celebrations", icon: Sparkles },
  { value: "icons", label: "Icons", icon: ImageIcon },
  { value: "backgrounds", label: "Backgrounds", icon: ImageIcon },
  { value: "general", label: "General", icon: ImageIcon },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("children");
  const [children, setChildren] = useState<Child[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", icon: "" });
  const [newItemForm, setNewItemForm] = useState({ title: "", icon: "" });
  const [showNewItem, setShowNewItem] = useState(false);

  // Media state
  const [mediaCategory, setMediaCategory] = useState<MediaCategory>("avatars");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar selection state
  const [selectingAvatarFor, setSelectingAvatarFor] = useState<string | null>(null);
  const [avatarOptions, setAvatarOptions] = useState<MediaFile[]>([]);

  // Icon picker state
  const [showNewIconPicker, setShowNewIconPicker] = useState(false);
  const [showEditIconPicker, setShowEditIconPicker] = useState(false);
  const [customIcons, setCustomIcons] = useState<MediaFile[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tab === "media") {
      loadMedia(mediaCategory);
    }
  }, [tab, mediaCategory]);

  async function loadData() {
    setLoading(true);
    try {
      const [childrenRes, analyticsRes, iconsRes] = await Promise.all([
        fetch("/api/admin/children"),
        fetch("/api/admin/analytics"),
        fetch("/api/admin/media?category=icons"),
      ]);

      if (childrenRes.ok) {
        const data = await childrenRes.json();
        setChildren(data.children || []);
        if (data.children?.length > 0 && !selectedChild) {
          setSelectedChild(data.children[0].id);
        }
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      if (iconsRes.ok) {
        const data = await iconsRes.json();
        setCustomIcons(data.files || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function loadMedia(category: MediaCategory) {
    setMediaLoading(true);
    try {
      const response = await fetch(`/api/admin/media?category=${category}`);
      if (response.ok) {
        const data = await response.json();
        setMediaFiles(data.files || []);
      }
    } catch (error) {
      console.error("Error loading media:", error);
      toast.error("Failed to load media");
    } finally {
      setMediaLoading(false);
    }
  }

  async function loadAvatarOptions() {
    try {
      const response = await fetch("/api/admin/media?category=avatars");
      if (response.ok) {
        const data = await response.json();
        setAvatarOptions(data.files || []);
      }
    } catch (error) {
      console.error("Error loading avatars:", error);
    }
  }

  async function loadCustomIcons() {
    try {
      const response = await fetch("/api/admin/media?category=icons");
      if (response.ok) {
        const data = await response.json();
        setCustomIcons(data.files || []);
      }
    } catch (error) {
      console.error("Error loading icons:", error);
    }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", mediaCategory);

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("File uploaded");
        loadMedia(mediaCategory);
      } else {
        const data = await response.json();
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deleteMedia(path: string) {
    if (!confirm("Delete this file?")) return;

    try {
      const response = await fetch(`/api/admin/media?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("File deleted");
        loadMedia(mediaCategory);
      } else {
        toast.error("Delete failed");
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  }

  async function setChildAvatar(childId: string, avatarUrl: string) {
    try {
      const response = await fetch("/api/admin/children", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: childId, avatar_url: avatarUrl }),
      });

      if (response.ok) {
        toast.success("Avatar updated");
        setSelectingAvatarFor(null);
        loadData();
      } else {
        toast.error("Failed to update avatar");
      }
    } catch (error) {
      toast.error("Failed to update avatar");
    }
  }

  const currentChild = children.find((c) => c.id === selectedChild);

  async function addItem() {
    if (!selectedChild || !newItemForm.title.trim()) return;

    try {
      const response = await fetch("/api/admin/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: selectedChild,
          title: newItemForm.title.trim(),
          icon: newItemForm.icon.trim() || null,
          weekdays_only: true,
        }),
      });

      if (response.ok) {
        toast.success("Item added");
        setNewItemForm({ title: "", icon: "" });
        setShowNewItem(false);
        loadData();
      } else {
        toast.error("Failed to add item");
      }
    } catch (error) {
      toast.error("Failed to add item");
    }
  }

  async function updateItem(id: string) {
    try {
      const response = await fetch("/api/admin/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: editForm.title.trim(),
          icon: editForm.icon.trim() || null,
        }),
      });

      if (response.ok) {
        toast.success("Item updated");
        setEditingItem(null);
        loadData();
      } else {
        toast.error("Failed to update item");
      }
    } catch (error) {
      toast.error("Failed to update item");
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this checklist item?")) return;

    try {
      const response = await fetch(`/api/admin/checklist?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Item deleted");
        loadData();
      } else {
        toast.error("Failed to delete item");
      }
    } catch (error) {
      toast.error("Failed to delete item");
    }
  }

  async function toggleActive(item: ChecklistItem) {
    try {
      const response = await fetch("/api/admin/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          is_active: !item.is_active,
        }),
      });

      if (response.ok) {
        toast.success(item.is_active ? "Item disabled" : "Item enabled");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to update item");
    }
  }

  async function moveItem(item: ChecklistItem, direction: "up" | "down") {
    if (!currentChild) return;

    const items = [...currentChild.checklist_items].sort(
      (a, b) => a.display_order - b.display_order
    );
    const index = items.findIndex((i) => i.id === item.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= items.length) return;

    const updates = [
      { id: items[index].id, display_order: items[swapIndex].display_order },
      { id: items[swapIndex].id, display_order: items[index].display_order },
    ];

    try {
      const response = await fetch("/api/admin/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updates }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      toast.error("Failed to reorder items");
    }
  }

  function startEditing(item: ChecklistItem) {
    setEditingItem(item.id);
    setEditForm({ title: item.title, icon: item.icon || "" });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    e.target.value = "";
  }

  function openAvatarSelector(childId: string) {
    setSelectingAvatarFor(childId);
    loadAvatarOptions();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-slate-600" />
            <span className="bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent">
              Admin
            </span>
          </h1>
          <p className="text-slate-600 mt-1">Manage checklists, media, and view analytics</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={tab === "children" ? "default" : "outline"}
            onClick={() => setTab("children")}
          >
            <Users className="h-4 w-4 mr-2" />
            Children & Checklists
          </Button>
          <Button
            variant={tab === "media" ? "default" : "outline"}
            onClick={() => setTab("media")}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Media Library
          </Button>
          <Button
            variant={tab === "analytics" ? "default" : "outline"}
            onClick={() => setTab("analytics")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>

        {/* Children & Checklists Tab */}
        {tab === "children" && (
          <>
            {/* Child Selector with Avatars */}
            <Card className="p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-slate-600" />
                <span className="font-medium">Select Child</span>
              </div>
              <div className="flex gap-4 flex-wrap">
                {children.map((child) => (
                  <div key={child.id} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => setSelectedChild(child.id)}
                      className={`relative w-16 h-16 rounded-full overflow-hidden border-4 transition-all ${
                        selectedChild === child.id
                          ? "border-purple-500 scale-110"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {child.avatar_type === "custom" && child.avatar_data ? (
                        <img
                          src={child.avatar_data}
                          alt={child.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xl font-bold">
                          {child.name.charAt(0)}
                        </div>
                      )}
                    </button>
                    <span className="text-sm font-medium">{child.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-6"
                      onClick={() => openAvatarSelector(child.id)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Avatar
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Avatar Selection Modal */}
            {selectingAvatarFor && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Select Avatar</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectingAvatarFor(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {avatarOptions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <User className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                      <p>No avatars uploaded yet.</p>
                      <p className="text-sm">Go to Media Library → Avatars to upload some.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {avatarOptions.map((avatar) => (
                        <button
                          key={avatar.path}
                          onClick={() => setChildAvatar(selectingAvatarFor, avatar.url)}
                          className="aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-purple-500 transition-all hover:scale-105"
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Checklist Items */}
            {currentChild && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">{currentChild.name}&apos;s Checklist</span>
                    <span className="text-sm text-slate-500">
                      ({currentChild.checklist_items.length} items)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowNewItem(true)}
                    disabled={showNewItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {/* New Item Form */}
                {showNewItem && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex gap-2 mb-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowNewIconPicker(!showNewIconPicker)}
                          className="w-14 h-10 px-2 border rounded-lg text-center text-xl bg-white hover:bg-slate-50 flex items-center justify-center"
                        >
                          {newItemForm.icon ? (
                            newItemForm.icon.startsWith("http") ? (
                              <img src={newItemForm.icon} alt="icon" className="w-6 h-6 object-cover rounded" />
                            ) : (
                              newItemForm.icon
                            )
                          ) : (
                            <span className="text-slate-400 text-sm">+</span>
                          )}
                        </button>
                        {showNewIconPicker && (
                          <IconPicker
                            value={newItemForm.icon}
                            onChange={(icon) => setNewItemForm({ ...newItemForm, icon })}
                            customIcons={customIcons.map(f => ({ url: f.url, name: f.name }))}
                            onClose={() => setShowNewIconPicker(false)}
                          />
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Item title"
                        value={newItemForm.title}
                        onChange={(e) =>
                          setNewItemForm({ ...newItemForm, title: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border rounded-lg"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addItem} disabled={!newItemForm.title.trim()}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewItem(false);
                          setShowNewIconPicker(false);
                          setNewItemForm({ title: "", icon: "" });
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-2">
                  {currentChild.checklist_items
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border ${
                          item.is_active
                            ? "bg-white border-slate-200"
                            : "bg-slate-100 border-slate-200 opacity-60"
                        }`}
                      >
                        {editingItem === item.id ? (
                          <>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowEditIconPicker(!showEditIconPicker)}
                                className="w-10 h-8 border rounded text-center text-lg bg-white hover:bg-slate-50 flex items-center justify-center"
                              >
                                {editForm.icon ? (
                                  editForm.icon.startsWith("http") ? (
                                    <img src={editForm.icon} alt="icon" className="w-5 h-5 object-cover rounded" />
                                  ) : (
                                    editForm.icon
                                  )
                                ) : (
                                  <span className="text-slate-400 text-xs">+</span>
                                )}
                              </button>
                              {showEditIconPicker && (
                                <IconPicker
                                  value={editForm.icon}
                                  onChange={(icon) => setEditForm({ ...editForm, icon })}
                                  customIcons={customIcons.map(f => ({ url: f.url, name: f.name }))}
                                  onClose={() => setShowEditIconPicker(false)}
                                />
                              )}
                            </div>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm({ ...editForm, title: e.target.value })
                              }
                              className="flex-1 px-2 py-1 border rounded"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                updateItem(item.id);
                                setShowEditIconPicker(false);
                              }}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingItem(null);
                                setShowEditIconPicker(false);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-xl w-8 text-center flex items-center justify-center">
                              {item.icon ? (
                                item.icon.startsWith("http") ? (
                                  <img src={item.icon} alt="icon" className="w-6 h-6 object-cover rounded" />
                                ) : (
                                  item.icon
                                )
                              ) : (
                                "📋"
                              )}
                            </span>
                            <span className="flex-1 font-medium">{item.title}</span>
                            {item.weekdays_only && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Weekdays
                              </span>
                            )}
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveItem(item, "up")}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveItem(item, "down")}
                                disabled={
                                  index === currentChild.checklist_items.length - 1
                                }
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(item)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleActive(item)}
                              >
                                {item.is_active ? "Disable" : "Enable"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                </div>

                {currentChild.checklist_items.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No checklist items yet. Add one above!
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        {/* Media Library Tab */}
        {tab === "media" && (
          <>
            {/* Category Selector */}
            <Card className="p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="h-5 w-5 text-slate-600" />
                <span className="font-medium">Category</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {MEDIA_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.value}
                      variant={mediaCategory === cat.value ? "default" : "outline"}
                      onClick={() => setMediaCategory(cat.value)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {cat.label}
                    </Button>
                  );
                })}
              </div>
            </Card>

            {/* Upload Section */}
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Upload to {mediaCategory}</h3>
                  <p className="text-sm text-slate-500">
                    {mediaCategory === "avatars" && "Upload profile pictures for the kids"}
                    {mediaCategory === "celebrations" && "Upload videos to play when checklists are complete"}
                    {mediaCategory === "icons" && "Upload custom icons for checklist items"}
                    {mediaCategory === "backgrounds" && "Upload background images for the dashboard"}
                    {mediaCategory === "general" && "Upload any photos or videos"}
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Media Grid */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">
                {mediaCategory.charAt(0).toUpperCase() + mediaCategory.slice(1)} ({mediaFiles.length})
              </h3>

              {mediaLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No files in this category</p>
                  <p className="text-sm">Upload some files above</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {mediaFiles.map((file) => {
                    const isVideo = file.url.match(/\.(mp4|webm|mov)$/i);
                    return (
                      <div key={file.path} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                          {isVideo ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                              <Video className="h-8 w-8 text-white" />
                            </div>
                          ) : (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 truncate">{file.name}</p>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                          onClick={() => deleteMedia(file.path)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && (
          <>
            {analytics ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="p-6">
                    <p className="text-sm text-slate-500 mb-1">Total Queries</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {analytics.total_queries}
                    </p>
                  </Card>
                  <Card className="p-6">
                    <p className="text-sm text-slate-500 mb-1">Queries Today</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {analytics.queries_today}
                    </p>
                  </Card>
                  <Card className="p-6">
                    <p className="text-sm text-slate-500 mb-1">Avg Response Time</p>
                    <p className="text-3xl font-bold text-teal-600">
                      {(analytics.avg_response_time_ms / 1000).toFixed(1)}s
                    </p>
                  </Card>
                </div>

                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    Top Queries
                  </h2>
                  {analytics.top_queries.length === 0 ? (
                    <p className="text-slate-500">No queries yet</p>
                  ) : (
                    <ul className="space-y-3">
                      {analytics.top_queries.map((q, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                        >
                          <span className="text-slate-700">{q.query}</span>
                          <span className="text-sm text-slate-400 bg-slate-100 px-2 py-1 rounded">
                            {q.count}x
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-slate-500">Analytics not available</p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
