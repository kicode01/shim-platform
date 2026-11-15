"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users as UsersIcon,
  Pencil,
  Check,
  X,
  Loader2,
  ShieldCheck,
  Ban,
  CheckCircle2,
  SlidersHorizontal,
  FlaskConical,
} from "lucide-react";
import { CERTIFICATE_ROLES } from "@/lib/roles";
import {
  ACCOUNT_TIERS,
  AccountTier,
  DEFAULT_ORGANIZER_PAGES,
  ORGANIZER_PAGES,
  ORGANIZER_PAGE_KEYS,
  OrganizerPageKey,
} from "@/lib/permissions";
import type { ProfileEditingFeature } from "@/lib/features";
import { emitProfileSyncSignal } from "@/lib/profile";

export interface ManageUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  allowedPages: string[];
  certificateRole: string;
  membershipId: string | null;
  eventCount: number;
  certificateCount: number;
}

const ROLE_BADGE_CLASSES: Record<string, string> = {
  Organizer: "text-indigo-700 bg-indigo-50 border-indigo-200/80",
  Speaker: "text-amber-700 bg-amber-50 border-amber-200/80",
  Participant: "text-emerald-700 bg-emerald-50 border-emerald-200/80",
  Others: "text-zinc-700 bg-zinc-100 border-zinc-200/80",
};

const TIER_BADGE_CLASSES: Record<string, string> = {
  admin: "text-zinc-900 bg-zinc-200/80 border-zinc-300",
  organizer: "text-sky-700 bg-sky-50 border-sky-200/80",
  member: "text-emerald-700 bg-emerald-50 border-emerald-200/80",
};

const TIER_LABELS: Record<string, string> = {
  admin: "Admin (shim-hq)",
  organizer: "Organizer (shim-studio)",
  member: "Attendee (shim-wallet)",
};

const TIER_SHORT_LABELS: Record<AccountTier, string> = {
  admin: "Admin",
  organizer: "Organizer",
  member: "Attendee",
};

export default function UsersClient({
  initialUsers,
  currentUserId,
  initialSearch = "",
  initialProfileFeature = {
    enabled: false,
    roles: [...ACCOUNT_TIERS],
    updatedAt: null,
  },
}: {
  initialUsers: ManageUser[];
  currentUserId: string;
  initialSearch?: string;
  initialProfileFeature?: ProfileEditingFeature;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<ManageUser[]>(initialUsers);
  const [profileFeature, setProfileFeature] = useState<ProfileEditingFeature>(
    initialProfileFeature
  );
  const [savingFeature, setSavingFeature] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<ManageUser | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<string>("member");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formCertRole, setFormCertRole] = useState<string>("Participant");
  const [formAllowedPages, setFormAllowedPages] = useState<OrganizerPageKey[]>([
    ...DEFAULT_ORGANIZER_PAGES,
  ]);
  const [syncProfileToRecords, setSyncProfileToRecords] = useState<boolean>(true);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const showToast = (
    message: string,
    type: "error" | "success" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const tierCounts = useMemo(() => {
    let admin = 0;
    let organizer = 0;
    let member = 0;
    for (const u of users) {
      if (u.role === "admin") admin += 1;
      else if (u.role === "organizer") organizer += 1;
      else member += 1;
    }
    return { all: users.length, admin, organizer, member };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      if (tierFilter !== "all" && u.role !== tierFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.membershipId || "").toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.certificateRole.toLowerCase().includes(q)
      );
    });
  }, [users, searchTerm, tierFilter]);

  const openEditModal = (u: ManageUser) => {
    setEditingUser(u);
    setFormName(u.name || "");
    setFormEmail(u.email || "");
    setFormRole(u.role || "member");
    setFormIsActive(u.isActive);
    const matchedCertRole = CERTIFICATE_ROLES.find((r) => r === u.certificateRole);
    setFormCertRole(matchedCertRole ?? "Participant");
    const validPages = u.allowedPages.filter((p): p is OrganizerPageKey =>
      (ORGANIZER_PAGE_KEYS as readonly string[]).includes(p)
    );
    setFormAllowedPages(validPages);
    setSyncProfileToRecords(true);
  };

  const toggleAllowedPage = (key: OrganizerPageKey) => {
    setFormAllowedPages((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        isActive: formIsActive,
        certificateRole: formCertRole,
        syncProfileToRecords,
      };
      if (formRole === "organizer") {
        payload.allowedPages = formAllowedPages;
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(data?.message || "Failed to update user.", "error");
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
                isActive: data.user.isActive,
                allowedPages: data.user.allowedPages,
                certificateRole: data.user.certificateRole,
              }
            : u
        )
      );

      showToast(
        `Saved changes for ${data.user.name || data.user.email || "user"}.`,
        "success"
      );
      setEditingUser(null);
    } catch (err) {
      console.error("Failed updating user:", err);
      showToast("Network error while saving user settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderTierBadge = (tier: string) => {
    const badgeClass =
      TIER_BADGE_CLASSES[tier] || "text-zinc-700 bg-zinc-100 border-zinc-200/80";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] leading-none font-bold tracking-wider uppercase border shrink-0 ${badgeClass}`}
      >
        {tier}
      </span>
    );
  };

  const renderStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={11} />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
        <Ban size={11} />
        Suspended
      </span>
    );
  };

  const renderAccessSummary = (u: ManageUser) => {
    if (u.role === "admin") {
      return (
        <span className="text-[11px] font-semibold text-zinc-600">
          Full HQ Control
        </span>
      );
    }
    if (u.role === "organizer") {
      const enabledCount = u.allowedPages.length;
      const hasSupport = u.allowedPages.includes("support");
      return (
        <div className="flex flex-wrap items-center gap-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
            <SlidersHorizontal size={11} className="text-zinc-500" />
            {enabledCount}/{ORGANIZER_PAGES.length} pages
          </span>
          {hasSupport && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
              +Support
            </span>
          )}
        </div>
      );
    }
    const certBadgeClass =
      ROLE_BADGE_CLASSES[u.certificateRole] ||
      "text-zinc-700 bg-zinc-100 border-zinc-200/80";
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${certBadgeClass}`}
      >
        {u.certificateRole || "Participant"}
      </span>
    );
  };

  const saveProfileFeature = async (next: {
    enabled: boolean;
    roles: AccountTier[];
  }) => {
    if (savingFeature) return;
    setSavingFeature(true);
    try {
      const res = await fetch("/api/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.profileEditing) {
        showToast(
          data?.message || "Failed to update experimental feature toggle.",
          "error"
        );
        return;
      }

      const updated: ProfileEditingFeature = {
        enabled: Boolean(data.profileEditing.enabled),
        roles: data.profileEditing.roles,
        updatedAt: data.profileEditing.updatedAt ?? null,
      };
      setProfileFeature(updated);
      emitProfileSyncSignal();
      router.refresh();
      showToast(
        updated.enabled
          ? `Experimental Profile Editing enabled (${updated.roles.map((r) => TIER_SHORT_LABELS[r]).join(", ")}).`
          : "Experimental Profile Editing turned OFF.",
        "success"
      );
    } catch {
      showToast("Network error while updating feature toggle.", "error");
    } finally {
      setSavingFeature(false);
    }
  };

  const handleToggleProfileMaster = () => {
    const nextEnabled = !profileFeature.enabled;
    const nextRoles =
      nextEnabled && profileFeature.roles.length === 0
        ? [...ACCOUNT_TIERS]
        : profileFeature.roles;
    void saveProfileFeature({ enabled: nextEnabled, roles: nextRoles });
  };

  const handleToggleProfileRole = (tier: AccountTier) => {
    const exists = profileFeature.roles.includes(tier);
    const nextRoles = exists
      ? profileFeature.roles.filter((r) => r !== tier)
      : ACCOUNT_TIERS.filter(
          (t) => t === tier || profileFeature.roles.includes(t)
        );
    const nextEnabled = nextRoles.length === 0 ? false : profileFeature.enabled;
    void saveProfileFeature({ enabled: nextEnabled, roles: nextRoles });
  };

  const isEditingSelf = editingUser?.id === currentUserId;

  return (
    <>
      <div className="flex-1 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full min-h-0">
        {/* Experimental Feature Rollout Gate */}
        <div className="px-4 sm:px-6 py-3 border-b border-zinc-200 bg-zinc-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <FlaskConical size={15} className="text-zinc-700" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  Self-Service Profile &amp; Icon Editing
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                  Experimental
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    profileFeature.enabled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-zinc-100 text-zinc-600 border-zinc-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      profileFeature.enabled ? "bg-emerald-500" : "bg-zinc-400"
                    }`}
                  />
                  {profileFeature.enabled ? "Live" : "Off"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Lets selected roles update display name, monochrome profile icon, and non-demo password from the Navbar account menu. Flipping Off disables it immediately.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 rounded-xl bg-white border border-zinc-200 p-1">
              {ACCOUNT_TIERS.map((tier) => {
                const active = profileFeature.roles.includes(tier);
                return (
                  <button
                    key={tier}
                    type="button"
                    disabled={savingFeature}
                    onClick={() => handleToggleProfileRole(tier)}
                    aria-pressed={active}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                    }`}
                  >
                    {TIER_SHORT_LABELS[tier]}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={profileFeature.enabled}
              aria-label="Toggle experimental self-service profile editing"
              disabled={savingFeature}
              onClick={handleToggleProfileMaster}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                profileFeature.enabled
                  ? "bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800"
                  : "bg-white border-zinc-300 text-zinc-700 hover:border-zinc-400"
              }`}
            >
              {savingFeature ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <span
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                    profileFeature.enabled ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      profileFeature.enabled ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                  />
                </span>
              )}
              <span>{profileFeature.enabled ? "Enabled" : "Disabled"}</span>
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div className="mob-filter-row flex flex-wrap bg-zinc-100 rounded-2xl p-1 w-full sm:w-auto">
            {[
              { key: "all", label: `All (${tierCounts.all})` },
              { key: "admin", label: `Admins (${tierCounts.admin})` },
              { key: "organizer", label: `Organizers (${tierCounts.organizer})` },
              { key: "member", label: `Members (${tierCounts.member})` },
            ].map((filter) => {
              const isSelected = tierFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setTierFilter(filter.key)}
                  className={`relative px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-colors duration-200 flex items-center justify-center ${
                    isSelected
                      ? "bg-white text-zinc-800 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64 lg:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search name, email, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {filteredUsers.length === 0 ? (
            <div className="h-[360px] flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-4">
                <UsersIcon size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-700 mb-1">
                No matching accounts found
              </h3>
              <p className="text-sm text-zinc-500 max-w-sm">
                Try clearing your search query or switching the account tier filter above.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:flex flex-1 flex-col min-h-0">
                <div className="overflow-y-auto overflow-x-hidden invisible-scrollbar bg-white border-b border-zinc-100 shrink-0">
                  <table className="table-modern w-full table-fixed">
                    <thead>
                      <tr>
                        <th className="w-[29%] px-5 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">
                          Account
                        </th>
                        <th className="w-[14%] px-3 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">
                          Tier
                        </th>
                        <th className="w-[14%] px-3 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">
                          Status
                        </th>
                        <th className="w-[21%] px-3 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">
                          Access / Default Role
                        </th>
                        <th className="w-[10%] px-3 py-3 text-center text-xs font-semibold text-zinc-500 tracking-wide">
                          Activity
                        </th>
                        <th className="w-[12%] px-5 py-3 text-right text-xs font-semibold text-zinc-500 tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 bg-white">
                  <table className="table-modern w-full table-fixed">
                    <tbody className="divide-y divide-zinc-100">
                      {filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors bg-white"
                        >
                          <td className="w-[29%] px-5 py-3.5 align-middle overflow-hidden">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold text-sm text-zinc-800 truncate">
                                {u.name || "Unnamed User"}
                              </span>
                              {u.id === currentUserId && (
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200 shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 truncate mt-0.5">
                              {u.email || "No email"}
                            </div>
                          </td>
                          <td className="w-[14%] px-3 py-3.5 align-middle">
                            {renderTierBadge(u.role)}
                          </td>
                          <td className="w-[14%] px-3 py-3.5 align-middle">
                            {renderStatusBadge(u.isActive)}
                          </td>
                          <td className="w-[21%] px-3 py-3.5 align-middle">
                            {renderAccessSummary(u)}
                          </td>
                          <td className="w-[10%] px-3 py-3.5 align-middle text-center">
                            <span className="text-xs font-semibold text-zinc-700">
                              {u.role === "organizer" || u.role === "admin"
                                ? `${u.eventCount} evt`
                                : `${u.certificateCount} cert`}
                            </span>
                          </td>
                          <td className="w-[12%] px-5 py-3.5 align-middle text-right">
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors whitespace-nowrap"
                            >
                              <Pencil size={12} />
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Stacked Cards */}
              <div className="lg:hidden flex-1 overflow-y-auto overflow-x-hidden bg-white">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="border-b border-zinc-100 px-4 py-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-zinc-800 truncate">
                          {u.name || "Unnamed User"}
                        </div>
                        <div className="text-xs text-zinc-500 truncate mt-0.5">
                          {u.email || "No email"}
                        </div>
                      </div>
                      {renderStatusBadge(u.isActive)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {renderTierBadge(u.role)}
                      {renderAccessSummary(u)}
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-3">
                      <span className="text-xs text-zinc-400">
                        {u.role === "organizer" || u.role === "admin"
                          ? `${u.eventCount} events`
                          : `${u.certificateCount} certificates`}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors"
                      >
                        <Pencil size={12} />
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Manage User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-800">
                      Manage Account
                    </h2>
                    <p className="text-xs text-zinc-500 truncate max-w-[260px]">
                      {editingUser.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                {/* Profile Typo Correction */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncProfileToRecords}
                    onChange={(e) => setSyncProfileToRecords(e.target.checked)}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-700"
                  />
                  <span>
                    Sync name &amp; email typo fixes to attendance records
                  </span>
                </label>

                <div className="border-t border-zinc-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Account Tier */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Workspace Tier
                    </label>
                    <select
                      value={formRole}
                      disabled={isEditingSelf}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700 disabled:bg-zinc-100 disabled:text-zinc-400"
                    >
                      {ACCOUNT_TIERS.map((tier) => (
                        <option key={tier} value={tier}>
                          {TIER_LABELS[tier] || tier}
                        </option>
                      ))}
                    </select>
                    {isEditingSelf && (
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Own admin tier is locked
                      </p>
                    )}
                  </div>

                  {/* Certificate Role */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Default Certificate Role
                    </label>
                    <select
                      value={formCertRole}
                      onChange={(e) => setFormCertRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    >
                      {CERTIFICATE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Account Active / Suspended Toggle */}
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70">
                  <div>
                    <div className="text-xs font-semibold text-zinc-800">
                      Account Status
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Suspended users cannot sign in or call dashboard APIs
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isEditingSelf}
                    onClick={() => setFormIsActive((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                      formIsActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    }`}
                  >
                    {formIsActive ? "Active" : "Suspended"}
                  </button>
                </div>

                {/* Per-Organizer Page Access Controls */}
                {formRole === "organizer" && (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
                          Organizer Studio Pages
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Choose which dashboard pages this organizer can open on shim-studio
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setFormAllowedPages([...ORGANIZER_PAGE_KEYS])
                          }
                          className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded bg-white border border-zinc-200"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormAllowedPages([...DEFAULT_ORGANIZER_PAGES])
                          }
                          className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded bg-white border border-zinc-200"
                        >
                          Default
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {ORGANIZER_PAGES.map((page) => {
                        const checked = formAllowedPages.includes(page.key);
                        return (
                          <label
                            key={page.key}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                              checked
                                ? "bg-white border-zinc-800 text-zinc-900 shadow-xs"
                                : "bg-zinc-100/70 border-zinc-200 text-zinc-500 hover:bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAllowedPage(page.key)}
                              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-700"
                            />
                            <span>{page.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-zinc-500 leading-relaxed pt-0.5">
                      Note: When <strong>Support</strong> is enabled, this organizer only receives{" "}
                      <em>Event Concern</em> tickets for their own events where the reporter checked into attendance (or was explicitly shared by Admin).
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving && <Loader2 size={13} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={`fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg text-xs font-semibold ${
              toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-zinc-900 border-zinc-800 text-white"
            }`}
          >
            {toast.type === "error" ? <X size={14} /> : <Check size={14} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
