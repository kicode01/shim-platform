"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
  X,
} from "lucide-react";
import { ProfileAvatarGlyph } from "@/components/ProfileAvatarGlyph";
import {
  emitProfileSyncSignal,
  PROFILE_ICONS,
  ProfileIconKey,
} from "@/lib/profile";

export interface EditableProfileData {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  membershipId: string | null;
  avatarIcon: string | null;
  isDemo: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin (shim-hq)",
  organizer: "Organizer (shim-studio)",
  member: "Attendee (shim-wallet)",
};

export default function ProfileEditModal({
  open,
  onClose,
  onSaved,
  onFeatureDisabled,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (profile: EditableProfileData) => void;
  onFeatureDisabled: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<EditableProfileData | null>(null);
  const [featureEnabled, setFeatureEnabled] = useState(true);

  const [name, setName] = useState("");
  const [avatarIcon, setAvatarIcon] = useState<ProfileIconKey>("initials");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);
    setError("");
    setShowPasswordSection(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswords(false);

    fetch("/api/profile", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!active) return;
        if (!res.ok || !data?.user) {
          setError(data?.message || "Unable to load profile details.");
          return;
        }
        setProfile(data.user);
        setName(data.user.name || "");
        setAvatarIcon(
          (data.user.avatarIcon as ProfileIconKey | null) || "initials"
        );
        const enabled = Boolean(data.canEditProfile);
        setFeatureEnabled(enabled);
        if (!enabled) {
          emitProfileSyncSignal();
          onFeatureDisabled();
        }
      })
      .catch(() => {
        if (active) setError("Network error while loading profile details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      active = false;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || loading || !featureEnabled) return;

    const cleanName = name.trim();
    if (!cleanName) {
      setError("Display name cannot be empty.");
      return;
    }

    if (showPasswordSection && (newPassword || confirmPassword || currentPassword)) {
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New password and confirmation do not match.");
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        name: cleanName,
        avatarIcon,
      };
      if (showPasswordSection && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
        payload.confirmPassword = confirmPassword;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 403 && !data?.canEditProfile && !profile?.isDemo) {
          setFeatureEnabled(false);
          emitProfileSyncSignal();
          onFeatureDisabled();
        }
        setError(data?.message || "Failed to save profile changes.");
        return;
      }

      emitProfileSyncSignal();
      onSaved(data.user);
      router.refresh();
      onClose();
    } catch {
      setError("Network error while saving profile.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-3 bg-zinc-50/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              <ProfileAvatarGlyph
                avatarIcon={avatarIcon === "initials" ? null : avatarIcon}
                name={name || profile?.name}
                size={16}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="edit-profile-title"
                  className="text-sm font-bold text-zinc-900 truncate"
                >
                  Edit Profile
                </h2>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  <FlaskConical size={10} />
                  Experimental
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate">
                {profile?.email || "Account customization"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit profile modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-2 text-zinc-500">
            <Loader2 size={20} className="animate-spin text-zinc-800" />
            <span className="text-xs font-medium">Loading profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {!featureEnabled && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-start gap-2 text-xs text-amber-900">
                <ShieldAlert size={15} className="shrink-0 mt-0.5 text-amber-700" />
                <span>
                  Self-service profile editing was disabled by an administrator.
                </span>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-2">
                Profile Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PROFILE_ICONS.map((icon) => {
                  const selected = avatarIcon === icon.key;
                  return (
                    <button
                      key={icon.key}
                      type="button"
                      disabled={!featureEnabled || saving}
                      onClick={() => setAvatarIcon(icon.key)}
                      aria-label={`Select ${icon.label} profile icon`}
                      aria-pressed={selected}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2 px-1 transition-all cursor-pointer disabled:opacity-50 ${
                        selected
                          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      <ProfileAvatarGlyph
                        avatarIcon={icon.key === "initials" ? null : icon.key}
                        name={name || profile?.name}
                        size={15}
                        textClassName="text-xs font-bold leading-none"
                      />
                      <span className="text-[10px] font-medium truncate max-w-full">
                        {icon.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-display-name"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
              >
                Display Name
              </label>
              <input
                id="profile-display-name"
                type="text"
                value={name}
                maxLength={80}
                required
                disabled={!featureEnabled || saving}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400 disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-xs">
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Account Tier
                </span>
                <span className="font-semibold text-zinc-700">
                  {ROLE_LABELS[profile?.role || ""] || profile?.role || "Member"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {profile?.membershipId ? "Membership ID" : "Email Status"}
                </span>
                <span className="font-semibold text-zinc-700">
                  {profile?.membershipId || "Admin-managed"}
                </span>
              </div>
            </div>

            {profile?.isDemo ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 flex items-center gap-2 text-xs text-zinc-600">
                <Lock size={14} className="shrink-0 text-zinc-400" />
                <span>
                  Shared demo account passwords cannot be changed.
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 overflow-hidden">
                <button
                  type="button"
                  disabled={!featureEnabled || saving}
                  onClick={() => setShowPasswordSection((prev) => !prev)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound size={13} className="text-zinc-500" />
                    Change Password
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {showPasswordSection ? "Cancel" : "Optional"}
                  </span>
                </button>

                {showPasswordSection && (
                  <div className="p-3 space-y-2.5 border-t border-zinc-200 bg-white">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="profile-current-password"
                        className="text-[11px] font-medium text-zinc-600"
                      >
                        Current Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => !prev)}
                        className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {showPasswords ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showPasswords ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      id="profile-current-password"
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      disabled={saving}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
                    />
                    <input
                      id="profile-new-password"
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 6 characters)"
                      disabled={saving}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
                    />
                    <input
                      id="profile-confirm-password"
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={saving}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !featureEnabled}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
