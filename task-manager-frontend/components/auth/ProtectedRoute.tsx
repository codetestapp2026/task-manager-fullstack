"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuthentication() {
      try {
        await apiFetch("/users/me");

        setAuthenticated(true);
      } catch {
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuthentication();
  }, [router]);

if (checkingAuth) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <LoadingSkeleton className="mx-auto h-12 w-12 rounded-full" />

          <LoadingSkeleton className="mx-auto mt-5 h-5 w-40" />

          <LoadingSkeleton className="mx-auto mt-3 h-4 w-56" />
        </div>
      </div>
    </main>
  );
}

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}