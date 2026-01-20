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
  KeyRound,
  Shield,
  UserPlus,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { IconPicker } from "@/components/IconPicker";
import { Avatar } from "@/components/Avatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface ChecklistItem {
  id: string;
  title: string;
  icon: string | null;
  display_order: number;
  weekdays_only: boolean;
  is_active: boolean;
  reset_daily?: boolean;
  active_days?: string;
}

interface FamilyMember {
  id: string;
  name: string;
  role: 'admin' | 'adult' | 'kid' | 'pet';
  pin_hash?: string | null;
  avatar_url?: string | null;
  has_checklist: boolean;
  created_at?: string;
  checklist_items: ChecklistItem[];
  profile_visibility?: {
    birthday: boolean;
    age: boolean;
    bloodType: boolean;
    allergies: boolean;
    medications: boolean;
    conditions: boolean;
    emergencyNotes: boolean;
    doctors: boolean;
    patientPortal: boolean;
    school: boolean;
    teachers: boolean;
    activities: boolean;
  };
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

type Tab = "family" | "media" | "analytics";
type MediaCategory = "avatars" | "celebrations" | "icons" | "backgrounds" | "general";

const MEDIA_CATEGORIES: { value: MediaCategory; label: string; icon: React.ElementType }[] = [
  { value: "avatars", label: "Avatars", icon: User },
  { value: "celebrations", label: "Celebrations", icon: Sparkles },
  { value: "icons", label: "Icons", icon: ImageIcon },
  { value: "backgrounds", label: "Backgrounds", icon: ImageIcon },
  { value: "general", label: "General", icon: ImageIcon },
];

const DAYS = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
];

function DaySelector({
  activeDays,
  onChange
}: {
  activeDays: string[];
  onChange: (days: string[]) => void;
}) {
  const toggleDay = (day: string) => {
    if (activeDays.includes(day)) {
      onChange(activeDays.filter(d => d !== day));
    } else {
      onChange([...activeDays, day]);
    }
  };

  return (
    <div className="flex gap-1" role="group" aria-label="Active days">
      {DAYS.map(({ key, label }) => {
        const isActive = activeDays.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggleDay(key)}
            aria-pressed={isActive}
            aria-label={`${key === 'mon' ? 'Monday' : key === 'tue' ? 'Tuesday' : key === 'wed' ? 'Wednesday' : key === 'thu' ? 'Thursday' : key === 'fri' ? 'Friday' : key === 'sat' ? 'Saturday' : 'Sunday'} ${isActive ? '(active)' : '(inactive)'}`}
            className={`w-7 h-7 rounded text-xs font-bold transition-all flex items-center justify-center ${
              isActive
                ? 'bg-purple-600 text-white ring-2 ring-purple-300 shadow-sm'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-dashed border-slate-300'
            }`}
          >
            {isActive ? (
              <span className="flex flex-col items-center leading-none">
                <span>{label}</span>
                <span className="text-[8px] mt-[-2px]">•</span>
              </span>
            ) : (
              label
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("family");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Family member state
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [editingPinFor, setEditingPinFor] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState<{ name: string; role: 'admin' | 'adult' | 'kid' | 'pet'; pin: string; has_checklist: boolean }>({ name: "", role: "kid", pin: "", has_checklist: false });
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

  // Loading states for buttons
  const [savingMember, setSavingMember] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [updatingDays, setUpdatingDays] = useState<string | null>(null);

  // Confirmation dialog states
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<string | null>(null);
  const [confirmDeleteMedia, setConfirmDeleteMedia] = useState<string | null>(null);
  const [deletingMember, setDeletingMember] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState(false);

  // Bulk setup state
  const [bulkSetupInProgress, setBulkSetupInProgress] = useState(false);
  const [showBulkSetupConfirm, setShowBulkSetupConfirm] = useState(false);

  // Standard checklist items for kids
  const STANDARD_CHECKLIST_ITEMS = [
    { title: "Make Bed", icon: "🛏️" },
    { title: "Get Dressed", icon: "👕" },
    { title: "Brush Teeth", icon: "🪥" },
    { title: "Eat Breakfast", icon: "🥣" },
    { title: "Pack Backpack", icon: "🎒" },
    { title: "Put On Shoes", icon: "👟" },
    { title: "Water Bottle", icon: "💧" },
    { title: "Snack", icon: "🍎" },
    { title: "Gizmo", icon: "🐹" },
    { title: "Chromebook", icon: "💻" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tab === "media") {
      loadMedia(mediaCategory);
    }
  }, [tab, mediaCategory]);

  async function updatePin(memberId: string) {
    if (newPin !== confirmPin) {
      toast.error("PINs don't match");
      return;
    }
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      toast.error("PIN must be 4 digits");
      return;
    }

    try {
      const response = await fetch("/api/admin/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, pin: newPin }),
      });

      if (response.ok) {
        toast.success("PIN updated");
        setEditingPinFor(null);
        setNewPin("");
        setConfirmPin("");
        loadData();
      } else {
        toast.error("Failed to update PIN");
      }
    } catch (error) {
      toast.error("Failed to update PIN");
    }
  }

  async function addMember() {
    if (!newMemberForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    // Only require PIN for non-pet members
    if (newMemberForm.role !== "pet") {
      if (newMemberForm.pin.length !== 4 || !/^\d+$/.test(newMemberForm.pin)) {
        toast.error("PIN must be 4 digits");
        return;
      }
    }

    setSavingMember(true);
    try {
      const response = await fetch("/api/admin/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemberForm),
      });

      if (response.ok) {
        toast.success("Member added");
        setShowAddMember(false);
        setNewMemberForm({ name: "", role: "kid", pin: "", has_checklist: false });
        loadData();
      } else {
        toast.error("Failed to add member");
      }
    } catch (error) {
      toast.error("Failed to add member");
    } finally {
      setSavingMember(false);
    }
  }

  async function deleteMember(memberId: string) {
    setDeletingMember(true);
    try {
      const response = await fetch(`/api/admin/family?id=${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Member deleted");
        if (selectedMember === memberId) {
          setSelectedMember(null);
        }
        loadData();
      } else {
        toast.error("Failed to delete member");
      }
    } catch (error) {
      toast.error("Failed to delete member");
    } finally {
      setDeletingMember(false);
      setConfirmDeleteMember(null);
    }
  }

  async function updateMember(memberId: string, updates: Partial<FamilyMember>) {
    try {
      const response = await fetch("/api/admin/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, ...updates }),
      });

      if (response.ok) {
        toast.success("Member updated");
        loadData();
      } else {
        toast.error("Failed to update member");
      }
    } catch (error) {
      toast.error("Failed to update member");
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [familyRes, analyticsRes, iconsRes] = await Promise.all([
        fetch("/api/admin/family"),
        fetch("/api/admin/analytics"),
        fetch("/api/admin/media?category=icons"),
      ]);

      if (familyRes.ok) {
        const data = await familyRes.json();
        setMembers(data.members || []);
        if (data.members?.length > 0 && !selectedMember) {
          setSelectedMember(data.members[0].id);
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
    setDeletingMedia(true);
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
    } finally {
      setDeletingMedia(false);
      setConfirmDeleteMedia(null);
    }
  }

  async function setMemberAvatar(memberId: string, avatarUrl: string) {
    try {
      const response = await fetch("/api/admin/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, avatar_url: avatarUrl }),
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

  const currentMember = members.find((m) => m.id === selectedMember);

  async function addItem() {
    if (!selectedMember || !newItemForm.title.trim()) return;

    setSavingItem(true);
    try {
      const response = await fetch("/api/admin/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: selectedMember,
          title: newItemForm.title.trim(),
          icon: newItemForm.icon.trim() || null,
          weekdays_only: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state directly instead of reloading all data
        // This prevents overwriting other pending changes (like day selections)
        setMembers(prev => prev.map(member =>
          member.id === selectedMember
            ? { ...member, checklist_items: [...member.checklist_items, data.item] }
            : member
        ));
        toast.success("Item added");
        setNewItemForm({ title: "", icon: "" });
        setShowNewItem(false);
      } else {
        toast.error("Failed to add item");
      }
    } catch (error) {
      toast.error("Failed to add item");
    } finally {
      setSavingItem(false);
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
        // Update local state directly instead of reloading all data
        setMembers(prev => prev.map(member => ({
          ...member,
          checklist_items: member.checklist_items.map(item =>
            item.id === id
              ? { ...item, title: editForm.title.trim(), icon: editForm.icon.trim() || null }
              : item
          )
        })));
        toast.success("Item updated");
        setEditingItem(null);
      } else {
        toast.error("Failed to update item");
      }
    } catch (error) {
      toast.error("Failed to update item");
    }
  }

  async function deleteItem(id: string) {
    setDeletingItem(id);
    try {
      const response = await fetch(`/api/admin/checklist?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Update local state directly instead of reloading all data
        // This prevents overwriting other pending changes (like day selections)
        setMembers(prev => prev.map(member => ({
          ...member,
          checklist_items: member.checklist_items.filter(item => item.id !== id)
        })));
        toast.success("Item deleted");
      } else {
        toast.error("Failed to delete item");
      }
    } catch (error) {
      toast.error("Failed to delete item");
    } finally {
      setDeletingItem(null);
      setConfirmDeleteItem(null);
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
        // Update local state directly instead of reloading all data
        setMembers(prev => prev.map(member => ({
          ...member,
          checklist_items: member.checklist_items.map(i =>
            i.id === item.id ? { ...i, is_active: !item.is_active } : i
          )
        })));
        toast.success(item.is_active ? "Item disabled" : "Item enabled");
      }
    } catch (error) {
      toast.error("Failed to update item");
    }
  }

  async function bulkSetupChecklists() {
    setBulkSetupInProgress(true);
    setShowBulkSetupConfirm(false);

    // Find all kids with checklists enabled
    const kidsWithChecklists = members.filter(m => m.role === 'kid' && m.has_checklist);

    if (kidsWithChecklists.length === 0) {
      toast.error("No kids with checklists enabled");
      setBulkSetupInProgress(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const kid of kidsWithChecklists) {
      // Delete existing items for this kid
      for (const existingItem of kid.checklist_items) {
        try {
          await fetch(`/api/admin/checklist?id=${existingItem.id}`, {
            method: "DELETE",
          });
        } catch (error) {
          console.error("Error deleting item:", error);
        }
      }

      // Add standard items
      for (let i = 0; i < STANDARD_CHECKLIST_ITEMS.length; i++) {
        const item = STANDARD_CHECKLIST_ITEMS[i];
        try {
          await fetch("/api/admin/checklist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              member_id: kid.id,
              title: item.title,
              icon: item.icon,
              weekdays_only: true,
            }),
          });
          successCount++;
        } catch (error) {
          console.error("Error adding item:", error);
          errorCount++;
        }
      }
    }

    // Reload data to show updated checklists
    await loadData();

    setBulkSetupInProgress(false);

    if (errorCount === 0) {
      toast.success(`Setup complete! Added ${successCount} items across ${kidsWithChecklists.length} kids`);
    } else {
      toast.warning(`Setup partially complete. ${successCount} items added, ${errorCount} errors`);
    }
  }

  async function updateItemDays(itemId: string, days: string[]) {
    setUpdatingDays(itemId);

    // Optimistic update - update local state immediately
    setMembers(prev => prev.map(member => ({
      ...member,
      checklist_items: member.checklist_items.map(item =>
        item.id === itemId ? { ...item, active_days: JSON.stringify(days) } : item
      )
    })));

    try {
      const res = await fetch('/api/admin/checklist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, active_days: JSON.stringify(days) }),
      });
      if (res.ok) {
        // No need to reload - state already updated
        toast.success('Days updated');
      } else {
        // Revert on failure
        loadData();
        toast.error('Failed to update days');
      }
    } catch (error) {
      console.error('Failed to update days:', error);
      // Revert on error
      loadData();
      toast.error('Failed to update days');
    } finally {
      setUpdatingDays(null);
    }
  }

  async function updateProfileVisibility(memberId: string, field: string, value: boolean) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const defaultVisibility = {
      birthday: true, age: true, bloodType: true, allergies: true,
      medications: true, conditions: true, emergencyNotes: true,
      doctors: true, patientPortal: true, school: true, teachers: true, activities: true,
    };

    const newVisibility = {
      ...(member.profile_visibility || defaultVisibility),
      [field]: value,
    };

    try {
      const res = await fetch('/api/admin/family', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, profile_visibility: newVisibility }),
      });
      if (res.ok) {
        setMembers(members.map(m =>
          m.id === memberId ? { ...m, profile_visibility: newVisibility } : m
        ));
        toast.success('Visibility updated');
      }
    } catch (error) {
      console.error('Failed to update visibility:', error);
      toast.error('Failed to update visibility');
    }
  }

  async function moveItem(item: ChecklistItem, direction: "up" | "down") {
    if (!currentMember) return;

    const items = [...currentMember.checklist_items].sort(
      (a, b) => a.display_order - b.display_order
    );
    const index = items.findIndex((i) => i.id === item.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= items.length) return;

    const newOrderA = items[swapIndex].display_order;
    const newOrderB = items[index].display_order;

    const updates = [
      { id: items[index].id, display_order: newOrderA },
      { id: items[swapIndex].id, display_order: newOrderB },
    ];

    // Update local state immediately (optimistic update)
    setMembers(prev => prev.map(member => {
      if (member.id !== currentMember.id) return member;
      return {
        ...member,
        checklist_items: member.checklist_items.map(i => {
          if (i.id === items[index].id) return { ...i, display_order: newOrderA };
          if (i.id === items[swapIndex].id) return { ...i, display_order: newOrderB };
          return i;
        })
      };
    }));

    try {
      const response = await fetch("/api/admin/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updates }),
      });

      if (!response.ok) {
        // Revert on failure
        loadData();
        toast.error("Failed to reorder items");
      }
    } catch (error) {
      loadData();
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

  function openAvatarSelector(memberId: string) {
    setSelectingAvatarFor(memberId);
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
            variant={tab === "family" ? "default" : "outline"}
            onClick={() => setTab("family")}
          >
            <Users className="h-4 w-4 mr-2" />
            Family
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

        {/* Family Tab */}
        {tab === "family" && (
          <>
            {/* Member Selector Grid */}
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-600" />
                  <span className="font-medium">Family Members</span>
                </div>
                <Button size="sm" onClick={() => setShowAddMember(true)} disabled={showAddMember}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add Member
                </Button>
              </div>

              {/* Add Member Form */}
              {showAddMember && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-3">Add New Family Member</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Name</label>
                      <input
                        type="text"
                        placeholder="Name"
                        value={newMemberForm.name}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Role</label>
                      <select
                        value={newMemberForm.role}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value as 'admin' | 'adult' | 'kid' | 'pet' })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="admin">Admin</option>
                        <option value="adult">Adult</option>
                        <option value="kid">Kid</option>
                        <option value="pet">Pet</option>
                      </select>
                    </div>
                    {newMemberForm.role !== "pet" && (
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">PIN (4 digits)</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="****"
                          value={newMemberForm.pin}
                          onChange={(e) => setNewMemberForm({ ...newMemberForm, pin: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="has_checklist"
                        checked={newMemberForm.has_checklist}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, has_checklist: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="has_checklist" className="text-sm text-slate-600">Enable checklist</label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={addMember} disabled={savingMember}>
                      {savingMember ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      {savingMember ? 'Saving...' : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setShowAddMember(false);
                      setNewMemberForm({ name: "", role: "kid", pin: "", has_checklist: false });
                    }} disabled={savingMember}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Members Grid */}
              <div className="flex gap-4 flex-wrap">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                      selectedMember === member.id
                        ? "bg-purple-50 ring-2 ring-purple-500"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <Avatar member={member} size="md" />
                    <span className="text-sm font-medium">{member.name}</span>
                    <span className="text-xs text-slate-500 capitalize">{member.role}</span>
                  </button>
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
                      <p className="text-sm">Go to Media Library - Avatars to upload some.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {avatarOptions.map((avatar) => (
                        <button
                          key={avatar.path}
                          onClick={() => setMemberAvatar(selectingAvatarFor, avatar.url)}
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

            {/* Profile Settings Section */}
            {currentMember && (
              <Card className="p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-slate-600" />
                    <span className="font-medium">{currentMember.name}&apos;s Profile</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setConfirmDeleteMember(currentMember.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar member={currentMember} size="lg" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAvatarSelector(currentMember.id)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Change Avatar
                    </Button>
                  </div>

                  {/* Name & Role */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={currentMember.name}
                        onChange={(e) => updateMember(currentMember.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Role</label>
                      <select
                        value={currentMember.role}
                        onChange={(e) => updateMember(currentMember.id, { role: e.target.value as 'admin' | 'adult' | 'kid' | 'pet' })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="admin">Admin</option>
                        <option value="adult">Adult</option>
                        <option value="kid">Kid</option>
                        <option value="pet">Pet</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* PIN Section - only for non-pets */}
                {currentMember.role !== "pet" && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <KeyRound className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-medium">PIN</span>
                    </div>
                    {editingPinFor === currentMember.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="New PIN"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                          className="w-24 px-2 py-1 border rounded text-center"
                        />
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="Confirm"
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                          className="w-24 px-2 py-1 border rounded text-center"
                        />
                        <Button size="sm" variant="ghost" onClick={() => updatePin(currentMember.id)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditingPinFor(null);
                          setNewPin("");
                          setConfirmPin("");
                        }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">
                          {currentMember.pin_hash ? "PIN is set" : "No PIN set"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingPinFor(currentMember.id)}
                        >
                          <KeyRound className="h-4 w-4 mr-1" />
                          {currentMember.pin_hash ? "Change PIN" : "Set PIN"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Enable Checklist Toggle */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enable_checklist"
                      checked={currentMember.has_checklist}
                      onChange={(e) => updateMember(currentMember.id, { has_checklist: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="enable_checklist" className="text-sm text-slate-600">
                      Enable checklist for this member
                    </label>
                  </div>
                </div>

                {/* Profile Visibility */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Profile Visibility
                  </h4>
                  <p className="text-sm text-slate-500 mb-3">Choose which fields appear on this person&apos;s profile page</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'birthday', label: 'Birthday' },
                      { key: 'age', label: 'Age' },
                      { key: 'bloodType', label: 'Blood Type' },
                      { key: 'allergies', label: 'Allergies' },
                      { key: 'medications', label: 'Medications' },
                      { key: 'conditions', label: 'Conditions' },
                      { key: 'emergencyNotes', label: 'Emergency Notes' },
                      { key: 'doctors', label: 'Doctors' },
                      { key: 'patientPortal', label: 'Patient Portal' },
                      { key: 'school', label: 'School' },
                      { key: 'teachers', label: 'Teachers' },
                      { key: 'activities', label: 'Activities' },
                    ].map(({ key, label }) => {
                      const member = members.find(m => m.id === selectedMember);
                      const isChecked = member?.profile_visibility?.[key as keyof typeof member.profile_visibility] ?? true;
                      return (
                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => updateProfileVisibility(selectedMember!, key, e.target.checked)}
                            className="rounded border-slate-300"
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* Checklist Section - only if has_checklist is true */}
            {currentMember && currentMember.has_checklist && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">{currentMember.name}&apos;s Checklist</span>
                    <span className="text-sm text-slate-500">
                      ({currentMember.checklist_items.length} items)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkSetupConfirm(true)}
                      disabled={bulkSetupInProgress}
                      title="Setup standard checklist for all kids"
                    >
                      {bulkSetupInProgress ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-1" />
                      )}
                      {bulkSetupInProgress ? "Setting up..." : "Bulk Setup All Kids"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowNewItem(true)}
                      disabled={showNewItem}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
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
                      <Button size="sm" onClick={addItem} disabled={!newItemForm.title.trim() || savingItem}>
                        {savingItem ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        {savingItem ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewItem(false);
                          setShowNewIconPicker(false);
                          setNewItemForm({ title: "", icon: "" });
                        }}
                        disabled={savingItem}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-2">
                  {currentMember.checklist_items
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
                            <div className="relative">
                              {updatingDays === item.id && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded">
                                  <RefreshCw className="h-3 w-3 animate-spin text-purple-600" />
                                </div>
                              )}
                              <DaySelector
                                activeDays={(() => {
                                  try {
                                    return JSON.parse(item.active_days || '["mon","tue","wed","thu","fri"]');
                                  } catch {
                                    return ['mon', 'tue', 'wed', 'thu', 'fri'];
                                  }
                                })()}
                                onChange={(days) => updateItemDays(item.id, days)}
                              />
                            </div>
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
                                  index === currentMember.checklist_items.length - 1
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
                                onClick={() => setConfirmDeleteItem(item.id)}
                                disabled={deletingItem === item.id}
                              >
                                {deletingItem === item.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                </div>

                {currentMember.checklist_items.length === 0 && (
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
                          onClick={() => setConfirmDeleteMedia(file.path)}
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

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={!!confirmDeleteMember}
        title="Delete Family Member"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong>{members.find(m => m.id === confirmDeleteMember)?.name}</strong>?
            This will also delete all their checklist items and cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletingMember}
        onConfirm={() => confirmDeleteMember && deleteMember(confirmDeleteMember)}
        onCancel={() => setConfirmDeleteMember(null)}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteItem}
        title="Delete Checklist Item"
        message={
          <>
            Are you sure you want to delete this checklist item? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={!!deletingItem}
        onConfirm={() => confirmDeleteItem && deleteItem(confirmDeleteItem)}
        onCancel={() => setConfirmDeleteItem(null)}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteMedia}
        title="Delete Media File"
        message="Are you sure you want to delete this file? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletingMedia}
        onConfirm={() => confirmDeleteMedia && deleteMedia(confirmDeleteMedia)}
        onCancel={() => setConfirmDeleteMedia(null)}
      />

      <ConfirmDialog
        isOpen={showBulkSetupConfirm}
        title="Setup Standard Checklists"
        message={
          <>
            This will <strong>replace all existing checklist items</strong> for{' '}
            <strong>{members.filter(m => m.role === 'kid' && m.has_checklist).map(m => m.name).join(', ')}</strong>{' '}
            with the standard morning checklist:
            <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
              {STANDARD_CHECKLIST_ITEMS.map(item => (
                <li key={item.title}>{item.icon} {item.title}</li>
              ))}
            </ul>
          </>
        }
        confirmLabel="Setup All Kids"
        variant="default"
        isLoading={bulkSetupInProgress}
        onConfirm={bulkSetupChecklists}
        onCancel={() => setShowBulkSetupConfirm(false)}
      />
    </div>
  );
}
