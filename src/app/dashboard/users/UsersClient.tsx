"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Check,
  Loader2,
  UserCog,
  Users as UsersIcon,
} from "lucide-react";
import { CERTIFICATE_ROLES, CertificateRole } from "@/lib/roles";

export interface ManagedUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  certificateRole: string;
  membershipId: string | null;
  certificateCount: number;
}

const ROLE_BADGE_CLASSES: Record<string, string> = {
  Organizer: "text-indigo-700 bg-indigo-50 border-indigo-200/80",
  Speaker: "text-emerald-700 bg-emerald-50 border-emerald-200/80",
  Participant: "text-zinc-700 bg-zinc-100 border-zinc-200/80",
  Others: "text-amber-700 bg-amber-50 border-amber-200/80",
};

const ROLE_DOT_CLASSES: Record<string, string> = {
  Organizer: "bg-indigo-500",
  Speaker: "bg-emerald-500",
  Participant: "bg-zinc-500",
  Others: "bg-amber-500",
};

export default function UsersClient({
  initialUsers,
}: {
  initialUsers: ManagedUser[];
}) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [selectedRole, setSelectedRole] =
    useState<CertificateRole>("Participant");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) setEditingUser(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saving]);

  const showToast = (
    message: string,
    type: "error" | "success" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.certificateRole !== roleFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.membershipId || "").toLowerCase().includes(q) ||
        (u.certificateRole || "").toLowerCase().includes(q)
      );
    });
  }, [users, searchTerm, roleFilter]);

  const openEditModal = (user: ManagedUser) => {
    setEditingUser(user);
    const matched = CERTIFICATE_ROLES.find((r) => r === user.certificateRole);
    setSelectedRole(matched ?? "Participant");
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateRole: selectedRole }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(data?.message || "Failed to update role.", "error");
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, certificateRole: data.user.certificateRole }
            : u
        )
      );
      showToast(
        `Updated ${editingUser.name || editingUser.email || "user"}'s role to ${data.user.certificateRole}.`,
        "success"
      );
      setEditingUser(null);
    } catch (err) {
      console.error("Failed updating user role:", err);
      showToast("Network error while saving role.", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderRoleBadge = (certRole: string) => {
    const badgeClass =
      ROLE_BADGE_CLASSES[certRole] ||
      "text-zinc-700 bg-zinc-100 border-zinc-200/80";
    const dotClass = ROLE_DOT_CLASSES[certRole] || "bg-zinc-500";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] leading-none font-bold tracking-wider uppercase border shrink-0 ${badgeClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
        <span>{certRole || "Participant"}</span>
      </span>
    );
  };

  return (
    <>
      <div className="flex-1 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full min-h-0">
        {/* Controls Bar */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div className="mob-filter-row flex flex-wrap bg-zinc-100 rounded-2xl p-1 w-full sm:w-auto">
            {["all", ...CERTIFICATE_ROLES].map((filter) => {
              const isActive = roleFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setRoleFilter(filter)}
                  className={`relative px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium capitalize rounded-xl transition-colors duration-200 flex items-center justify-center ${
                    isActive
                      ? "bg-white text-zinc-800 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"
                  }`}
                >
                  {filter}
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
              placeholder="Search member or email..."
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
                No matching members found
              </h3>
              <p className="text-sm text-zinc-500 max-w-sm">
                Try clearing your search or switching the role filter above.
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
                        <th className="w-[38%] px-5 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">
                          Member
                        </th>
                        <th className="w-[18%] px-4 py-3 text-center text-xs font-semibold text-zinc-500 tracking-wide">
                          Credentials
                        </th>
                        <th className="w-[22%] px-4 py-3 text-center text-xs font-semibold text-zinc-500 tracking-wide">
                          Role
                        </th>
                        <th className="w-[22%] px-5 py-3 text-right text-xs font-semibold text-zinc-500 tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 bg-white">
                  <table className="table-modern w-full table-fixed">
                    <tbody className="divide-y divide-zinc-100">
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors bg-white"
                        >
                          <td className="w-[38%] px-5 py-3.5 overflow-hidden align-middle">
                            <div className="font-semibold text-sm text-zinc-800 truncate">
                              {user.name || "Unnamed User"}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[13px] text-zinc-500 min-w-0">
                              <span className="truncate">
                                {user.email || "No email"}
                              </span>
                              {user.membershipId && (
                                <span className="font-mono text-[11px] px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded shrink-0">
                                  {user.membershipId}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="w-[18%] px-4 py-3.5 align-middle text-center">
                            <span className="text-sm font-medium text-zinc-600 tabular-nums">
                              {user.certificateCount}
                            </span>
                          </td>
                          <td className="w-[22%] px-4 py-3.5 align-middle text-center">
                            {renderRoleBadge(user.certificateRole)}
                          </td>
                          <td className="w-[22%] px-5 py-3.5 align-middle text-right">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 shadow-xs transition-colors"
                            >
                              <UserCog size={14} />
                              <span>Edit Role</span>
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
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="border-b border-zinc-100 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-zinc-800 truncate">
                          {user.name || "Unnamed User"}
                        </div>
                        <div className="text-[13px] text-zinc-500 truncate">
                          {user.email || "No email"}
                        </div>
                      </div>
                      {renderRoleBadge(user.certificateRole)}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-zinc-500">
                        {user.certificateCount} credential
                        {user.certificateCount === 1 ? "" : "s"}
                        {user.membershipId ? ` · ${user.membershipId}` : ""}
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="mob-card-action inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors shrink-0"
                      >
                        <UserCog size={14} />
                        <span>Edit Role</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-[2px]"
            onClick={() => !saving && setEditingUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-zinc-100 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-800">Edit Role</h2>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[280px]">
                    {editingUser.name || "Member"}
                    {editingUser.email ? ` (${editingUser.email})` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveRole} className="p-6 space-y-5">
                <div>
                  <label
                    htmlFor="certificateRoleSelect"
                    className="block text-sm font-medium text-zinc-700 mb-2"
                  >
                    Certificate Designation Role
                  </label>
                  <select
                    id="certificateRoleSelect"
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(e.target.value as CertificateRole)
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent shadow-xs"
                  >
                    {CERTIFICATE_ROLES.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {roleOption}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                    Updates this member&apos;s designation on event rosters and
                    pre-fills certificate templates during generation.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 border border-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    <span>{saving ? "Saving..." : "Save Role"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border border-zinc-200 ${
              toast.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            } flex items-center gap-3`}
          >
            {toast.type === "error" ? (
              <X size={18} className="text-red-500 shrink-0" />
            ) : (
              <Check size={18} className="text-emerald-500 shrink-0" />
            )}
            <span className="font-medium text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
