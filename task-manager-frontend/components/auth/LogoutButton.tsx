"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type LogoutButtonProps = {
  className?: string;
};

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleLogout() {
    try {
      setLoading(true);

      await apiFetch("/auth/logout", {
        method: "POST",
      });

      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={className}
      >
        Logout{" "}
      </button>

      <ConfirmDialog
        open={showConfirm}
        title="Log Out?"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogout}
        onCancel={() => {
          if (!loading) {
            setShowConfirm(false);
          }
        }}
        loading={loading}
        icon={<LogOut size={24} />}
      />
    </>
  );
}
