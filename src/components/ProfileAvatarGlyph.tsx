"use client";

import {
  Award,
  Briefcase,
  Compass,
  GraduationCap,
  Layers,
  ShieldCheck,
  Sparkles,
  Terminal,
  User,
  UserCheck,
} from "lucide-react";

const ICON_COMPONENTS = {
  user: User,
  shield: ShieldCheck,
  award: Award,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  sparkles: Sparkles,
  compass: Compass,
  layers: Layers,
  terminal: Terminal,
} as const;

/**
 * Renders either the user's selected profile icon or falls back to their name
 * initial (matching the default Navbar avatar pill).
 */
export function ProfileAvatarGlyph({
  avatarIcon,
  name,
  size = 14,
  textClassName = "",
}: {
  avatarIcon?: string | null;
  name?: string | null;
  size?: number;
  textClassName?: string;
}) {
  if (avatarIcon && avatarIcon in ICON_COMPONENTS) {
    const IconComponent =
      ICON_COMPONENTS[avatarIcon as keyof typeof ICON_COMPONENTS];
    return <IconComponent size={size} aria-hidden="true" />;
  }

  const initial = name?.trim().charAt(0).toUpperCase();
  if (initial) {
    return <span className={textClassName}>{initial}</span>;
  }

  return <UserCheck size={size} aria-hidden="true" />;
}
