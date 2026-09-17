"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/" })} 
      className="btn btn-outline"
      style={{ padding: "0.4rem 0.8rem" }}
    >
      <LogOut size={16} /> Logout
    </button>
  );
}
