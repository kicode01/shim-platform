"use client";

import { LogOut } from "lucide-react";
import { performFullLogoutRedirect } from "@/lib/client-auth";

export default function LogoutButton() {
  return (
    <button 
      onClick={() => void performFullLogoutRedirect()} 
      className="btn btn-outline"
      style={{ padding: "0.4rem 0.8rem" }}
    >
      <LogOut size={16} /> Logout
    </button>
  );
}
