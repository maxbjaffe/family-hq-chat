"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

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
  checklist_items: ChecklistItem[];
}

interface AnalyticsSummary {
  total_queries: number;
  avg_response_time_ms: number;
  queries_today: number;
  top_queries: { query: string; count: number }[];
}

type Tab = "children" | "analytics";

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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [childrenRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/children"),
        fetch("/api/admin/analytics"),
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
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
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

    // Swap display orders
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-slate-600" />
            <span className="bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent">
              Admin
            </span>
          </h1>
          <p className="text-slate-600 mt-1">Manage checklists and view analytics</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === "children" ? "default" : "outline"}
            onClick={() => setTab("children")}
            className="flex-1 md:flex-none"
          >
            <Users className="h-4 w-4 mr-2" />
            Children & Checklists
          </Button>
          <Button
            variant={tab === "analytics" ? "default" : "outline"}
            onClick={() => setTab("analytics")}
            className="flex-1 md:flex-none"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>

        {tab === "children" && (
          <>
            {/* Child Selector */}
            <Card className="p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-slate-600" />
                <span className="font-medium">Select Child</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant={selectedChild === child.id ? "default" : "outline"}
                    onClick={() => setSelectedChild(child.id)}
                    className="min-w-[100px]"
                  >
                    {child.name}
                    {child.age && (
                      <span className="ml-1 text-xs opacity-70">({child.age})</span>
                    )}
                  </Button>
                ))}
              </div>
            </Card>

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
                      <input
                        type="text"
                        placeholder="Icon (emoji)"
                        value={newItemForm.icon}
                        onChange={(e) =>
                          setNewItemForm({ ...newItemForm, icon: e.target.value })
                        }
                        className="w-16 px-3 py-2 border rounded-lg text-center text-xl"
                      />
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
                            <input
                              type="text"
                              value={editForm.icon}
                              onChange={(e) =>
                                setEditForm({ ...editForm, icon: e.target.value })
                              }
                              className="w-12 px-2 py-1 border rounded text-center text-lg"
                            />
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
                              onClick={() => updateItem(item.id)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingItem(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-xl w-8 text-center">
                              {item.icon || "📋"}
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

        {tab === "analytics" && (
          <>
            {analytics ? (
              <>
                {/* Stats Grid */}
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

                {/* Top Queries */}
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
